import json
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.deps import get_db, require_roles
from app.models.user import User, UserRoleEnum
from app.models.location import Location
from app.models.report import WasteReport, AIPrediction, ReportStatusHistory, ReportStatusEnum
from app.models.collector import CollectionTask
from app.models.reward import Reward, RewardTransaction, Badge, UserBadge
from app.services.ai_service import ai_service
from app.services.storage_service import storage_service
from app.services.rewards_service import rewards_service, RewardsService
from app.schemas.report import (
    ReportResponse,
    ReportDetailResponse,
    LocationResponse,
    AIPredictionResponse,
    ReportStatusHistoryResponse
)
from datetime import datetime, timezone
from app.schemas.reward import (
    RewardResponse,
    RewardTransactionResponse,
    BadgeResponse,
    LeaderboardEntry,
    RedeemRewardResponse
)

router = APIRouter(prefix="/citizen", tags=["Citizen"])

@router.post("/reports", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def submit_waste_report(
    file: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    address: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    predicted_class: Optional[str] = Form(None),
    confidence: Optional[float] = Form(None),
    class_probabilities_json: Optional[str] = Form(None),
    current_user: User = Depends(require_roles([UserRoleEnum.CITIZEN, UserRoleEnum.ADMIN])),
    db: Session = Depends(get_db)
):
    # Validate location coordinates
    if not (-90.0 <= latitude <= 90.0) or not (-180.0 <= longitude <= 180.0):
        raise HTTPException(status_code=400, detail="Invalid latitude or longitude coordinates.")

    # Save uploaded image
    image_url = await storage_service.save_report_image(file)

    # Determine AI classification: use provided or run model directly
    if not predicted_class or confidence is None or not class_probabilities_json:
        await file.seek(0)
        file_bytes = await file.read()
        ai_result = ai_service.predict(file_bytes)
        pred_class = ai_result["prediction"]
        conf_val = ai_result["confidence"]
        probs = ai_result["all_predictions"]
    else:
        pred_class = predicted_class
        conf_val = confidence
        try:
            probs = json.loads(class_probabilities_json)
        except Exception:
            probs = {pred_class: conf_val}

    # Create location
    location = Location(
        latitude=latitude,
        longitude=longitude,
        address=address
    )
    db.add(location)
    db.flush()

    # Generate unique report code
    count = db.query(WasteReport).count() + 1
    report_code = f"W2W-{1000 + count}"

    # Create report
    report = WasteReport(
        report_code=report_code,
        citizen_id=current_user.id,
        location_id=location.id,
        image_url=image_url,
        description=description,
        status=ReportStatusEnum.PENDING
    )
    db.add(report)
    db.flush()

    # Create auditable AI prediction record
    prediction_record = AIPrediction(
        report_id=report.id,
        model_version="ResNet18-Waste2Worth-v1.0",
        predicted_class=pred_class,
        confidence=conf_val,
        class_probabilities=probs
    )
    db.add(prediction_record)

    # Record initial status transition
    status_history = ReportStatusHistory(
        report_id=report.id,
        old_status=None,
        new_status=ReportStatusEnum.PENDING.value,
        changed_by=current_user.id,
        comment="Report submitted with AI waste classification."
    )
    db.add(status_history)
    db.commit()
    db.refresh(report)

    # Award submission eco-points
    rewards_service.award_points(
        db=db,
        user_id=current_user.id,
        points=RewardsService.POINTS_SUBMIT_REPORT,
        reason=f"Waste report submitted: {report_code} ({pred_class})",
        report_id=report.id
    )

    return _build_report_response(report)

@router.get("/reports", response_model=List[ReportResponse])
def get_my_reports(
    current_user: User = Depends(require_roles([UserRoleEnum.CITIZEN, UserRoleEnum.ADMIN])),
    db: Session = Depends(get_db)
):
    reports = db.query(WasteReport).filter(
        WasteReport.citizen_id == current_user.id
    ).order_by(desc(WasteReport.created_at)).all()
    return [_build_report_response(r) for r in reports]

@router.get("/reports/{report_id}", response_model=ReportDetailResponse)
def get_my_report_detail(
    report_id: uuid.UUID,
    current_user: User = Depends(require_roles([UserRoleEnum.CITIZEN, UserRoleEnum.ADMIN])),
    db: Session = Depends(get_db)
):
    query = db.query(WasteReport).filter(WasteReport.id == report_id)
    if current_user.role.name == UserRoleEnum.CITIZEN:
        query = query.filter(WasteReport.citizen_id == current_user.id)
    
    report = query.first()
    if not report:
        raise HTTPException(status_code=404, detail="Waste report not found.")

    res = _build_report_response(report)
    history_items = [
        ReportStatusHistoryResponse(
            id=h.id,
            old_status=h.old_status,
            new_status=h.new_status,
            changed_by_name=h.actor.name if h.actor else "System",
            comment=h.comment,
            created_at=h.created_at
        )
        for h in report.status_history
    ]

    task = report.collection_task
    collector_name = None
    if task and task.collector and task.collector.user:
        collector_name = task.collector.user.name

    return ReportDetailResponse(
        **res.model_dump(),
        status_history=history_items,
        collection_task_id=task.id if task else None,
        collector_name=collector_name
    )

@router.get("/rewards", response_model=List[RewardResponse])
def get_rewards_catalog(
    db: Session = Depends(get_db)
):
    rewards = db.query(Reward).filter(Reward.is_active == True).all()
    return rewards

@router.post("/rewards/{reward_id}/redeem", response_model=RedeemRewardResponse)
def redeem_reward(
    reward_id: uuid.UUID,
    current_user: User = Depends(require_roles([UserRoleEnum.CITIZEN, UserRoleEnum.ADMIN])),
    db: Session = Depends(get_db)
):
    reward = db.query(Reward).filter(Reward.id == reward_id, Reward.is_active == True).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found or inactive.")

    if current_user.points_balance < reward.points_required:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient Eco-Points. Required: {reward.points_required}, Available: {current_user.points_balance}"
        )

    # Generate unique digital voucher code (e.g. W2W-AMZ-88219)
    prefix = reward.name[:3].upper().replace(" ", "").replace("$", "")
    unique_suffix = uuid.uuid4().hex[:6].upper()
    voucher_code = f"W2W-{prefix}-{unique_suffix}"

    # Deduct points from user balance
    current_user.points_balance -= reward.points_required

    # Record negative transaction
    tx = RewardTransaction(
        user_id=current_user.id,
        points=-reward.points_required,
        reason=f"Redeemed: {reward.name} (Voucher Code: {voucher_code})"
    )
    db.add(tx)
    db.commit()
    db.refresh(current_user)

    now = datetime.now(timezone.utc)
    return RedeemRewardResponse(
        success=True,
        reward_id=reward.id,
        reward_name=reward.name,
        voucher_code=voucher_code,
        points_spent=reward.points_required,
        remaining_balance=current_user.points_balance,
        message=f"Successfully redeemed {reward.name}! Use voucher code {voucher_code}.",
        created_at=now
    )


@router.get("/badges", response_model=List[BadgeResponse])
def get_citizen_badges(
    current_user: User = Depends(require_roles([UserRoleEnum.CITIZEN, UserRoleEnum.ADMIN])),
    db: Session = Depends(get_db)
):
    all_badges = db.query(Badge).all()
    user_badges = {ub.badge_id: ub.earned_at for ub in current_user.badges}
    result = []
    for b in all_badges:
        earned = b.id in user_badges
        result.append(BadgeResponse(
            id=b.id,
            name=b.name,
            description=b.description,
            requirement=b.requirement,
            icon=b.icon,
            earned=earned,
            earned_at=user_badges.get(b.id)
        ))
    return result

@router.get("/leaderboard", response_model=List[LeaderboardEntry])
def get_leaderboard(
    db: Session = Depends(get_db)
):
    # Top 20 citizens by points balance
    citizens = db.query(User).join(User.role).filter(
        User.role.has(name=UserRoleEnum.CITIZEN),
        User.is_active == True
    ).order_by(desc(User.points_balance)).limit(20).all()

    leaderboard = []
    for i, c in enumerate(citizens, start=1):
        reports_count = db.query(WasteReport).filter(
            WasteReport.citizen_id == c.id,
            WasteReport.status.in_([ReportStatusEnum.VERIFIED, ReportStatusEnum.COLLECTED, ReportStatusEnum.COMPLETED])
        ).count()
        cleanups = db.query(WasteReport).filter(
            WasteReport.citizen_id == c.id,
            WasteReport.status == ReportStatusEnum.COMPLETED
        ).count()
        # Privacy-conscious display name: e.g. "Chaitanya K."
        parts = c.name.strip().split()
        if len(parts) > 1:
            display_name = f"{parts[0]} {parts[-1][0]}."
        else:
            display_name = parts[0] if parts else "Eco Citizen"

        leaderboard.append(LeaderboardEntry(
            rank=i,
            user_id=c.id,
            display_name=display_name,
            points_balance=c.points_balance,
            verified_reports_count=reports_count,
            cleanups_count=cleanups,
            badge_count=len(c.badges)
        ))
    return leaderboard

def _build_report_response(report: WasteReport) -> ReportResponse:
    pred_resp = None
    if report.ai_prediction:
        pred_resp = AIPredictionResponse(
            id=report.ai_prediction.id,
            model_version=report.ai_prediction.model_version,
            predicted_class=report.ai_prediction.predicted_class,
            confidence=report.ai_prediction.confidence,
            class_probabilities=report.ai_prediction.class_probabilities,
            created_at=report.ai_prediction.created_at
        )

    return ReportResponse(
        id=report.id,
        report_code=report.report_code,
        citizen_id=report.citizen_id,
        citizen_name=report.citizen.name if report.citizen else "Citizen",
        image_url=report.image_url,
        description=report.description,
        status=report.status,
        location=LocationResponse(
            id=report.location.id,
            latitude=report.location.latitude,
            longitude=report.location.longitude,
            address=report.location.address
        ),
        ai_prediction=pred_resp,
        created_at=report.created_at,
        updated_at=report.updated_at,
        verified_at=report.verified_at,
        completed_at=report.completed_at
    )

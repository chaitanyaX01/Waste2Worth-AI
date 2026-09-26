import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, cast, Numeric

from app.api.deps import get_db, require_roles
from app.models.user import User, UserRoleEnum
from app.models.report import WasteReport, AIPrediction, ReportStatusEnum, ReportStatusHistory
from app.models.location import Location
from app.models.collector import (
    Collector,
    CollectionTask,
    CollectionTaskStatusEnum,
    CollectionTaskHistory,
    TaskPriorityEnum
)
from app.models.reward import RewardTransaction
from app.services.rewards_service import rewards_service, RewardsService
from app.api.v1.citizen import _build_report_response
from app.api.v1.collector import _build_task_response
from app.schemas.report import ReportResponse, ReportDetailResponse, ReportStatusHistoryResponse
from app.schemas.collector import CollectionTaskResponse, CollectorProfileResponse
from app.schemas.admin import (
    DashboardStatsResponse,
    WasteDistribution,
    HotspotLocation,
    VerifyReportRequest,
    AssignCollectorRequest
)

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/dashboard/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    current_user: User = Depends(require_roles([UserRoleEnum.ADMIN])),
    db: Session = Depends(get_db)
):
    total_reports = db.query(WasteReport).count()
    pending_reports = db.query(WasteReport).filter(WasteReport.status == ReportStatusEnum.PENDING).count()
    verified_reports = db.query(WasteReport).filter(WasteReport.status == ReportStatusEnum.VERIFIED).count()
    assigned_reports = db.query(WasteReport).filter(WasteReport.status == ReportStatusEnum.ASSIGNED).count()
    in_progress_reports = db.query(WasteReport).filter(WasteReport.status == ReportStatusEnum.IN_PROGRESS).count()
    collected_reports = db.query(WasteReport).filter(WasteReport.status == ReportStatusEnum.COLLECTED).count()
    completed_reports = db.query(WasteReport).filter(WasteReport.status == ReportStatusEnum.COMPLETED).count()
    rejected_reports = db.query(WasteReport).filter(WasteReport.status == ReportStatusEnum.REJECTED).count()

    total_collectors = db.query(Collector).count()
    active_collectors = db.query(Collector).filter(Collector.is_available == True).count()

    total_citizens = db.query(User).join(User.role).filter(User.role.has(name=UserRoleEnum.CITIZEN)).count()

    # Total points issued
    points_sum = db.query(func.sum(RewardTransaction.points)).scalar() or 0

    # 7 Classes Waste Distribution
    distribution: List[WasteDistribution] = []
    classes = ["cardboard", "e-waste", "glass", "medical", "metal", "paper", "plastic", "other"]
    
    # Query count grouped by predicted_class
    category_counts = db.query(
        AIPrediction.predicted_class, func.count(AIPrediction.id)
    ).group_by(AIPrediction.predicted_class).all()

    counts_map = {row[0].lower(): row[1] for row in category_counts}
    pred_total = sum(counts_map.values()) if counts_map else 0

    for c in classes:
        cnt = counts_map.get(c, 0)
        pct = round((cnt / pred_total * 100.0), 1) if pred_total > 0 else 0.0
        distribution.append(WasteDistribution(
            category=c,
            count=cnt,
            percentage=pct
        ))

    # Calculate real hotspots by grouping locations rounded to ~100m (approx 3 decimal places)
    hotspots: List[HotspotLocation] = []
    try:
        report_locs = db.query(
            Location.latitude,
            Location.longitude,
            AIPrediction.predicted_class
        ).join(WasteReport, Location.id == WasteReport.location_id).join(
            AIPrediction, WasteReport.id == AIPrediction.report_id
        ).all()

        clusters: Dict[tuple, Dict[str, Any]] = {}
        for lat, lon, cat in report_locs:
            key = (round(float(lat), 3), round(float(lon), 3))
            if key not in clusters:
                clusters[key] = {"count": 0, "categories": set()}
            clusters[key]["count"] += 1
            if cat:
                clusters[key]["categories"].add(cat)

        sorted_clusters = sorted(clusters.items(), key=lambda x: x[1]["count"], reverse=True)[:10]
        for (lat, lon), data in sorted_clusters:
            hotspots.append(HotspotLocation(
                latitude=lat,
                longitude=lon,
                report_count=data["count"],
                categories=list(data["categories"]),
                radius_meters=150.0
            ))
    except Exception as e:
        hotspots = []

    return DashboardStatsResponse(
        total_reports=total_reports,
        pending_reports=pending_reports,
        verified_reports=verified_reports,
        assigned_reports=assigned_reports,
        in_progress_reports=in_progress_reports,
        collected_reports=collected_reports,
        completed_reports=completed_reports,
        rejected_reports=rejected_reports,
        total_collectors=total_collectors,
        active_collectors=active_collectors,
        total_citizens=total_citizens,
        total_points_issued=int(points_sum),
        waste_distribution=distribution,
        recent_hotspots=hotspots
    )

@router.get("/reports", response_model=List[ReportResponse])
def get_all_reports(
    status_filter: Optional[ReportStatusEnum] = None,
    category_filter: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_roles([UserRoleEnum.ADMIN])),
    db: Session = Depends(get_db)
):
    query = db.query(WasteReport).join(WasteReport.location).join(WasteReport.ai_prediction)

    if status_filter:
        query = query.filter(WasteReport.status == status_filter)
    if category_filter:
        query = query.filter(AIPrediction.predicted_class.ilike(category_filter))
    if search:
        query = query.filter(
            (WasteReport.report_code.ilike(f"%{search}%")) |
            (WasteReport.description.ilike(f"%{search}%")) |
            (Location.address.ilike(f"%{search}%"))
        )

    reports = query.order_by(desc(WasteReport.created_at)).all()
    return [_build_report_response(r) for r in reports]

@router.get("/reports/{report_id}", response_model=ReportDetailResponse)
def get_admin_report_detail(
    report_id: uuid.UUID,
    current_user: User = Depends(require_roles([UserRoleEnum.ADMIN])),
    db: Session = Depends(get_db)
):
    report = db.query(WasteReport).filter(WasteReport.id == report_id).first()
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

@router.patch("/reports/{report_id}/verify", response_model=ReportResponse)
def verify_report(
    report_id: uuid.UUID,
    req: VerifyReportRequest,
    current_user: User = Depends(require_roles([UserRoleEnum.ADMIN])),
    db: Session = Depends(get_db)
):
    report = db.query(WasteReport).filter(WasteReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Waste report not found.")

    old_status = report.status.value
    target_status = req.status.upper()
    if target_status not in ["VERIFIED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Status must be VERIFIED or REJECTED.")

    now = datetime.now(timezone.utc)
    if target_status == "VERIFIED":
        report.status = ReportStatusEnum.VERIFIED
        report.verified_at = now
        # Award verified eco-points to citizen (+20 points)
        rewards_service.award_points(
            db=db,
            user_id=report.citizen_id,
            points=RewardsService.POINTS_VERIFY_REPORT,
            reason=f"Admin verified report {report.report_code}",
            report_id=report.id
        )
    else:
        report.status = ReportStatusEnum.REJECTED

    history = ReportStatusHistory(
        report_id=report.id,
        old_status=old_status,
        new_status=report.status.value,
        changed_by=current_user.id,
        comment=req.comment or f"Report reviewed by admin: {report.status.value}"
    )
    db.add(history)
    db.commit()
    db.refresh(report)

    return _build_report_response(report)

@router.post("/tasks/assign", response_model=CollectionTaskResponse)
def assign_collector(
    req: AssignCollectorRequest,
    report_id: uuid.UUID = Query(...),
    current_user: User = Depends(require_roles([UserRoleEnum.ADMIN])),
    db: Session = Depends(get_db)
):
    report = db.query(WasteReport).filter(WasteReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Waste report not found.")

    if report.status not in [ReportStatusEnum.VERIFIED, ReportStatusEnum.ASSIGNED]:
        raise HTTPException(
            status_code=400,
            detail=f"Only VERIFIED or ASSIGNED reports can be assigned to a collector. Current: {report.status.value}"
        )

    collector = db.query(Collector).filter(Collector.id == req.collector_id).first()
    if not collector:
        raise HTTPException(status_code=404, detail="Collector not found.")

    old_status = report.status.value
    now = datetime.now(timezone.utc)

    # Check if task already exists
    task = db.query(CollectionTask).filter(CollectionTask.report_id == report.id).first()
    if not task:
        task = CollectionTask(
            report_id=report.id,
            collector_id=collector.id,
            assigned_by=current_user.id,
            priority=req.priority,
            status=CollectionTaskStatusEnum.ASSIGNED,
            assigned_at=now
        )
        db.add(task)
    else:
        task.collector_id = collector.id
        task.priority = req.priority
        task.status = CollectionTaskStatusEnum.ASSIGNED

    report.status = ReportStatusEnum.ASSIGNED

    report_history = ReportStatusHistory(
        report_id=report.id,
        old_status=old_status,
        new_status=ReportStatusEnum.ASSIGNED.value,
        changed_by=current_user.id,
        comment=f"Assigned to collector {collector.user.name} ({collector.employee_code})"
    )
    db.add(report_history)

    db.commit()
    db.refresh(task)
    return _build_task_response(task)

@router.patch("/tasks/{task_id}/verify-completion", response_model=CollectionTaskResponse)
def verify_task_completion(
    task_id: uuid.UUID,
    comment: Optional[str] = None,
    current_user: User = Depends(require_roles([UserRoleEnum.ADMIN])),
    db: Session = Depends(get_db)
):
    """
    Admin reviews collection evidence (before & after photos) and marks report COMPLETED.
    Awards +50 cleanup completion points to the reporting citizen.
    """
    task = db.query(CollectionTask).filter(CollectionTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Collection task not found.")

    if task.status != CollectionTaskStatusEnum.COLLECTED:
        raise HTTPException(
            status_code=400,
            detail=f"Task must be in COLLECTED status before admin completion verification. Current: {task.status.value}"
        )

    now = datetime.now(timezone.utc)
    old_task_status = task.status.value
    old_report_status = task.report.status.value

    task.status = CollectionTaskStatusEnum.COMPLETED
    task.completed_at = now

    task.report.status = ReportStatusEnum.COMPLETED
    task.report.completed_at = now

    task_hist = CollectionTaskHistory(
        task_id=task.id,
        old_status=old_task_status,
        new_status=CollectionTaskStatusEnum.COMPLETED.value,
        changed_by=current_user.id,
        comment=comment or "Admin verified cleanup evidence. Collection completed."
    )
    db.add(task_hist)

    rep_hist = ReportStatusHistory(
        report_id=task.report_id,
        old_status=old_report_status,
        new_status=ReportStatusEnum.COMPLETED.value,
        changed_by=current_user.id,
        comment="Admin approved evidence and marked cleanup COMPLETED."
    )
    db.add(rep_hist)

    # Award cleanup bonus to citizen
    rewards_service.award_points(
        db=db,
        user_id=task.report.citizen_id,
        points=RewardsService.POINTS_CLEANUP_COMPLETE,
        reason=f"Cleanup completed & verified for {task.report.report_code}",
        report_id=task.report_id,
        task_id=task.id
    )

    db.commit()
    db.refresh(task)
    return _build_task_response(task)

@router.get("/collectors", response_model=List[CollectorProfileResponse])
def get_all_collectors(
    current_user: User = Depends(require_roles([UserRoleEnum.ADMIN])),
    db: Session = Depends(get_db)
):
    collectors = db.query(Collector).all()
    results = []
    for c in collectors:
        assigned_cnt = db.query(CollectionTask).filter(
            CollectionTask.collector_id == c.id,
            CollectionTask.status.in_([CollectionTaskStatusEnum.ASSIGNED, CollectionTaskStatusEnum.IN_PROGRESS])
        ).count()
        completed_cnt = db.query(CollectionTask).filter(
            CollectionTask.collector_id == c.id,
            CollectionTask.status == CollectionTaskStatusEnum.COMPLETED
        ).count()
        results.append(CollectorProfileResponse(
            id=c.id,
            user_id=c.user_id,
            name=c.user.name,
            email=c.user.email,
            phone=c.phone or c.user.phone,
            employee_code=c.employee_code,
            organization=c.organization,
            service_area=c.service_area,
            is_available=c.is_available,
            assigned_tasks_count=assigned_cnt,
            completed_tasks_count=completed_cnt
        ))
    return results

@router.get("/citizens")
def get_all_citizens(
    current_user: User = Depends(require_roles([UserRoleEnum.ADMIN])),
    db: Session = Depends(get_db)
):
    citizens = db.query(User).join(User.role).filter(User.role.has(name=UserRoleEnum.CITIZEN)).all()
    return [
        {
            "id": str(c.id),
            "name": c.name,
            "email": c.email,
            "phone": c.phone,
            "points_balance": c.points_balance,
            "is_active": c.is_active,
            "reports_count": len(c.reports),
            "badges_count": len(c.badges),
            "created_at": c.created_at
        }
        for c in citizens
    ]

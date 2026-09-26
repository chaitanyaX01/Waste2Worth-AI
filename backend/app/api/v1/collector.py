import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.deps import get_db, require_roles, get_current_collector
from app.models.user import User, UserRoleEnum
from app.models.report import WasteReport, ReportStatusEnum, ReportStatusHistory
from app.models.collector import (
    Collector,
    CollectionTask,
    CollectionTaskStatusEnum,
    CollectionTaskHistory,
    CollectionEvidence,
    EvidenceTypeEnum,
    TaskPriorityEnum
)
from app.services.storage_service import storage_service
from app.api.v1.citizen import _build_report_response
from app.schemas.collector import (
    CollectionTaskResponse,
    TaskStatusUpdate,
    EvidenceResponse,
    CollectorProfileResponse
)

router = APIRouter(prefix="/collector", tags=["Collector"])

@router.get("/tasks", response_model=List[CollectionTaskResponse])
def get_collector_tasks(
    status_filter: Optional[CollectionTaskStatusEnum] = None,
    priority_filter: Optional[TaskPriorityEnum] = None,
    current_user: User = Depends(require_roles([UserRoleEnum.COLLECTOR, UserRoleEnum.ADMIN])),
    db: Session = Depends(get_db)
):
    query = db.query(CollectionTask)
    if current_user.role.name == UserRoleEnum.COLLECTOR:
        collector = db.query(Collector).filter(Collector.user_id == current_user.id).first()
        if not collector:
            return []
        query = query.filter(CollectionTask.collector_id == collector.id)

    if status_filter:
        query = query.filter(CollectionTask.status == status_filter)
    if priority_filter:
        query = query.filter(CollectionTask.priority == priority_filter)

    tasks = query.order_by(desc(CollectionTask.created_at)).all()
    return [_build_task_response(t) for t in tasks]

@router.get("/tasks/{task_id}", response_model=CollectionTaskResponse)
def get_task_detail(
    task_id: uuid.UUID,
    current_user: User = Depends(require_roles([UserRoleEnum.COLLECTOR, UserRoleEnum.ADMIN])),
    db: Session = Depends(get_db)
):
    task = db.query(CollectionTask).filter(CollectionTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Collection task not found.")

    if current_user.role.name == UserRoleEnum.COLLECTOR:
        collector = db.query(Collector).filter(Collector.user_id == current_user.id).first()
        if not collector or task.collector_id != collector.id:
            raise HTTPException(status_code=403, detail="You do not have access to this task.")

    return _build_task_response(task)

@router.patch("/tasks/{task_id}/status", response_model=CollectionTaskResponse)
def update_task_status(
    task_id: uuid.UUID,
    update_in: TaskStatusUpdate,
    current_user: User = Depends(require_roles([UserRoleEnum.COLLECTOR, UserRoleEnum.ADMIN])),
    db: Session = Depends(get_db)
):
    task = db.query(CollectionTask).filter(CollectionTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Collection task not found.")

    old_task_status = task.status.value
    new_task_status = update_in.status.value

    # Validate state transitions
    valid_transitions = {
        CollectionTaskStatusEnum.ASSIGNED.value: [CollectionTaskStatusEnum.IN_PROGRESS.value, CollectionTaskStatusEnum.CANCELLED.value],
        CollectionTaskStatusEnum.IN_PROGRESS.value: [CollectionTaskStatusEnum.COLLECTED.value, CollectionTaskStatusEnum.CANCELLED.value],
        CollectionTaskStatusEnum.COLLECTED.value: [CollectionTaskStatusEnum.COMPLETED.value]  # Admin verification
    }

    if current_user.role.name == UserRoleEnum.COLLECTOR:
        # Collector can only mark IN_PROGRESS or COLLECTED
        if new_task_status not in [CollectionTaskStatusEnum.IN_PROGRESS.value, CollectionTaskStatusEnum.COLLECTED.value]:
            raise HTTPException(
                status_code=400,
                detail=f"Collectors can only transition tasks to IN_PROGRESS or COLLECTED. Requested: {new_task_status}"
            )
        if new_task_status not in valid_transitions.get(old_task_status, []):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid task transition from {old_task_status} to {new_task_status}"
            )

    now = datetime.now(timezone.utc)
    task.status = update_in.status
    if update_in.status == CollectionTaskStatusEnum.IN_PROGRESS:
        task.started_at = now
        task.report.status = ReportStatusEnum.IN_PROGRESS
    elif update_in.status == CollectionTaskStatusEnum.COLLECTED:
        task.collected_at = now
        task.report.status = ReportStatusEnum.COLLECTED
    elif update_in.status == CollectionTaskStatusEnum.COMPLETED:
        task.completed_at = now
        task.report.status = ReportStatusEnum.COMPLETED
        task.report.completed_at = now

    # Record task history
    task_history = CollectionTaskHistory(
        task_id=task.id,
        old_status=old_task_status,
        new_status=new_task_status,
        changed_by=current_user.id,
        comment=update_in.comment or f"Status changed to {new_task_status}"
    )
    db.add(task_history)

    # Record report history
    report_history = ReportStatusHistory(
        report_id=task.report_id,
        old_status=old_task_status,
        new_status=task.report.status.value,
        changed_by=current_user.id,
        comment=f"Updated by collector/operator: {new_task_status}"
    )
    db.add(report_history)

    db.commit()
    db.refresh(task)
    return _build_task_response(task)

@router.post("/tasks/{task_id}/evidence", response_model=EvidenceResponse, status_code=status.HTTP_201_CREATED)
async def upload_task_evidence(
    task_id: uuid.UUID,
    file: UploadFile = File(...),
    evidence_type: EvidenceTypeEnum = Form(...),
    notes: Optional[str] = Form(None),
    current_user: User = Depends(require_roles([UserRoleEnum.COLLECTOR, UserRoleEnum.ADMIN])),
    db: Session = Depends(get_db)
):
    task = db.query(CollectionTask).filter(CollectionTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Collection task not found.")

    image_url = await storage_service.save_evidence_image(file)

    evidence = CollectionEvidence(
        task_id=task.id,
        evidence_type=evidence_type,
        image_url=image_url,
        notes=notes,
        uploaded_by=current_user.id
    )
    db.add(evidence)
    db.commit()
    db.refresh(evidence)

    return EvidenceResponse(
        id=evidence.id,
        task_id=evidence.task_id,
        evidence_type=evidence.evidence_type,
        image_url=evidence.image_url,
        notes=evidence.notes,
        created_at=evidence.created_at
    )

@router.get("/profile", response_model=CollectorProfileResponse)
def get_collector_profile(
    current_user: User = Depends(require_roles([UserRoleEnum.COLLECTOR, UserRoleEnum.ADMIN])),
    db: Session = Depends(get_db)
):
    collector = db.query(Collector).filter(Collector.user_id == current_user.id).first()
    if not collector:
        raise HTTPException(status_code=404, detail="Collector profile not found.")

    assigned_count = db.query(CollectionTask).filter(
        CollectionTask.collector_id == collector.id,
        CollectionTask.status.in_([CollectionTaskStatusEnum.ASSIGNED, CollectionTaskStatusEnum.IN_PROGRESS])
    ).count()

    completed_count = db.query(CollectionTask).filter(
        CollectionTask.collector_id == collector.id,
        CollectionTask.status == CollectionTaskStatusEnum.COMPLETED
    ).count()

    return CollectorProfileResponse(
        id=collector.id,
        user_id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        phone=collector.phone or current_user.phone,
        employee_code=collector.employee_code,
        organization=collector.organization,
        service_area=collector.service_area,
        is_available=collector.is_available,
        assigned_tasks_count=assigned_count,
        completed_tasks_count=completed_count
    )

def _build_task_response(task: CollectionTask) -> CollectionTaskResponse:
    collector_name = task.collector.user.name if task.collector and task.collector.user else None
    evidence_list = [
        EvidenceResponse(
            id=e.id,
            task_id=e.task_id,
            evidence_type=e.evidence_type,
            image_url=e.image_url,
            notes=e.notes,
            created_at=e.created_at
        )
        for e in task.evidence
    ]

    return CollectionTaskResponse(
        id=task.id,
        report_id=task.report_id,
        collector_id=task.collector_id,
        collector_name=collector_name,
        priority=task.priority,
        status=task.status,
        report=_build_report_response(task.report),
        assigned_at=task.assigned_at,
        accepted_at=task.accepted_at,
        started_at=task.started_at,
        collected_at=task.collected_at,
        completed_at=task.completed_at,
        evidence=evidence_list
    )

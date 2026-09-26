import uuid
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel
from app.models.collector import CollectionTaskStatusEnum, TaskPriorityEnum, EvidenceTypeEnum
from app.schemas.report import ReportResponse

class EvidenceResponse(BaseModel):
    id: uuid.UUID
    task_id: uuid.UUID
    evidence_type: EvidenceTypeEnum
    image_url: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TaskHistoryResponse(BaseModel):
    id: uuid.UUID
    old_status: Optional[str] = None
    new_status: str
    changed_by_name: Optional[str] = None
    comment: Optional[str] = None
    created_at: datetime

class CollectionTaskResponse(BaseModel):
    id: uuid.UUID
    report_id: uuid.UUID
    collector_id: Optional[uuid.UUID] = None
    collector_name: Optional[str] = None
    priority: TaskPriorityEnum
    status: CollectionTaskStatusEnum
    report: ReportResponse
    assigned_at: datetime
    accepted_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    collected_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    evidence: List[EvidenceResponse] = []

    class Config:
        from_attributes = True

class TaskStatusUpdate(BaseModel):
    status: CollectionTaskStatusEnum
    comment: Optional[str] = None

class CollectorProfileResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    email: str
    phone: Optional[str] = None
    employee_code: str
    organization: Optional[str] = None
    service_area: Optional[str] = None
    is_available: bool
    assigned_tasks_count: int = 0
    completed_tasks_count: int = 0

    class Config:
        from_attributes = True

import uuid
from typing import Dict, List, Optional
from pydantic import BaseModel
from app.models.collector import TaskPriorityEnum

class WasteDistribution(BaseModel):
    category: str
    count: int
    percentage: float

class HotspotLocation(BaseModel):
    latitude: float
    longitude: float
    report_count: int
    categories: List[str]
    radius_meters: float = 150.0

class DashboardStatsResponse(BaseModel):
    total_reports: int
    pending_reports: int
    verified_reports: int
    assigned_reports: int
    in_progress_reports: int
    collected_reports: int
    completed_reports: int
    rejected_reports: int
    total_collectors: int
    active_collectors: int
    total_citizens: int
    total_points_issued: int
    waste_distribution: List[WasteDistribution]
    recent_hotspots: List[HotspotLocation]

class VerifyReportRequest(BaseModel):
    status: str  # "VERIFIED" or "REJECTED"
    comment: Optional[str] = None

class AssignCollectorRequest(BaseModel):
    collector_id: uuid.UUID
    priority: TaskPriorityEnum = TaskPriorityEnum.MEDIUM
    comment: Optional[str] = None

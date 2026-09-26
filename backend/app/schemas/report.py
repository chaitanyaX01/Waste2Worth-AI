import uuid
from typing import Optional, Dict, List
from datetime import datetime
from pydantic import BaseModel, Field
from app.models.report import ReportStatusEnum

class LocationCreate(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    address: Optional[str] = None

class LocationResponse(BaseModel):
    id: uuid.UUID
    latitude: float
    longitude: float
    address: Optional[str] = None

    class Config:
        from_attributes = True

class AIPredictionResponse(BaseModel):
    id: uuid.UUID
    model_version: str
    predicted_class: str
    confidence: float
    class_probabilities: Dict[str, float]
    created_at: datetime

    class Config:
        from_attributes = True

class ReportStatusHistoryResponse(BaseModel):
    id: uuid.UUID
    old_status: Optional[str] = None
    new_status: str
    changed_by_name: Optional[str] = None
    comment: Optional[str] = None
    created_at: datetime

class ReportCreate(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    address: Optional[str] = None
    description: Optional[str] = None
    # If the user already called /predict before submitting
    predicted_class: Optional[str] = None
    confidence: Optional[float] = None
    class_probabilities: Optional[Dict[str, float]] = None

class ReportResponse(BaseModel):
    id: uuid.UUID
    report_code: str
    citizen_id: uuid.UUID
    citizen_name: str
    image_url: str
    description: Optional[str] = None
    status: ReportStatusEnum
    location: LocationResponse
    ai_prediction: Optional[AIPredictionResponse] = None
    created_at: datetime
    updated_at: datetime
    verified_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ReportDetailResponse(ReportResponse):
    status_history: List[ReportStatusHistoryResponse] = []
    collection_task_id: Optional[uuid.UUID] = None
    collector_name: Optional[str] = None

import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class CollectionTaskStatusEnum(str, enum.Enum):
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    COLLECTED = "COLLECTED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class TaskPriorityEnum(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"

class EvidenceTypeEnum(str, enum.Enum):
    BEFORE = "BEFORE"
    AFTER = "AFTER"

class Collector(Base):
    __tablename__ = "collectors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    employee_code = Column(String(50), unique=True, index=True, nullable=False)
    organization = Column(String(150), nullable=True, default="Municipal Waste Services")
    phone = Column(String(30), nullable=True)
    service_area = Column(String(100), nullable=True, default="Central District")
    is_available = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="collector_profile")
    tasks = relationship("CollectionTask", back_populates="collector")

class CollectionTask(Base):
    __tablename__ = "collection_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    report_id = Column(UUID(as_uuid=True), ForeignKey("reports.id", ondelete="CASCADE"), unique=True, nullable=False)
    collector_id = Column(UUID(as_uuid=True), ForeignKey("collectors.id", ondelete="SET NULL"), nullable=True)
    assigned_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    priority = Column(Enum(TaskPriorityEnum), default=TaskPriorityEnum.MEDIUM, nullable=False)
    status = Column(Enum(CollectionTaskStatusEnum), default=CollectionTaskStatusEnum.ASSIGNED, nullable=False, index=True)

    assigned_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    collected_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    report = relationship("WasteReport", back_populates="collection_task")
    collector = relationship("Collector", back_populates="tasks")
    assigner = relationship("User", foreign_keys=[assigned_by])
    history = relationship("CollectionTaskHistory", back_populates="task", cascade="all, delete-orphan", order_by="CollectionTaskHistory.created_at.desc()")
    evidence = relationship("CollectionEvidence", back_populates="task", cascade="all, delete-orphan")

class CollectionTaskHistory(Base):
    __tablename__ = "collection_task_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    task_id = Column(UUID(as_uuid=True), ForeignKey("collection_tasks.id", ondelete="CASCADE"), nullable=False)
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    changed_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    task = relationship("CollectionTask", back_populates="history")
    actor = relationship("User")

class CollectionEvidence(Base):
    __tablename__ = "collection_evidence"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    task_id = Column(UUID(as_uuid=True), ForeignKey("collection_tasks.id", ondelete="CASCADE"), nullable=False)
    evidence_type = Column(Enum(EvidenceTypeEnum), nullable=False)
    image_url = Column(String(500), nullable=False)
    notes = Column(Text, nullable=True)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    task = relationship("CollectionTask", back_populates="evidence")
    uploader = relationship("User")

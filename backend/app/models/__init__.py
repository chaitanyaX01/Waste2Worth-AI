# SQLAlchemy Models Package
from app.core.database import Base
from app.models.user import User, Role, UserRoleEnum
from app.models.location import Location
from app.models.report import WasteReport, AIPrediction, ReportStatusHistory, ReportStatusEnum
from app.models.collector import (
    Collector,
    CollectionTask,
    CollectionTaskHistory,
    CollectionEvidence,
    CollectionTaskStatusEnum,
    EvidenceTypeEnum,
    TaskPriorityEnum
)
from app.models.reward import (
    Reward,
    RewardTransaction,
    Badge,
    UserBadge
)
from app.models.media import MediaFile

__all__ = [
    "Base",
    "User",
    "Role",
    "UserRoleEnum",
    "Location",
    "WasteReport",
    "AIPrediction",
    "ReportStatusHistory",
    "ReportStatusEnum",
    "Collector",
    "CollectionTask",
    "CollectionTaskHistory",
    "CollectionEvidence",
    "CollectionTaskStatusEnum",
    "EvidenceTypeEnum",
    "TaskPriorityEnum",
    "Reward",
    "RewardTransaction",
    "Badge",
    "UserBadge",
    "MediaFile"
]


import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, LargeBinary
from app.core.database import Base

class MediaFile(Base):
    __tablename__ = "media_files"

    id = Column(String(255), primary_key=True, index=True)  # e.g. "reports/uuid.jpg" or "evidence/uuid.jpg"
    filename = Column(String(255), nullable=False, index=True)
    content_type = Column(String(100), default="image/jpeg", nullable=False)
    data = Column(LargeBinary, nullable=False)
    file_size = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class RewardResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str
    points_required: int
    is_active: bool

    class Config:
        from_attributes = True

class RewardTransactionResponse(BaseModel):
    id: uuid.UUID
    points: int
    reason: str
    report_id: Optional[uuid.UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True

class BadgeResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str
    requirement: str
    icon: str
    earned: bool = False
    earned_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class LeaderboardEntry(BaseModel):
    rank: int
    user_id: uuid.UUID
    display_name: str
    points_balance: int
    verified_reports_count: int
    cleanups_count: int
    badge_count: int

class RedeemRewardResponse(BaseModel):
    success: bool
    reward_id: uuid.UUID
    reward_name: str
    voucher_code: str
    points_spent: int
    remaining_balance: int
    message: str
    created_at: datetime


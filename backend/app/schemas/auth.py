import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from app.models.user import UserRoleEnum

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    phone: str = Field(..., min_length=10, max_length=15, description="Compulsory 10-digit mobile number")
    otp_code: Optional[str] = Field(None, description="6-digit verification code sent via SMS/WhatsApp")
    role: UserRoleEnum = UserRoleEnum.CITIZEN
    # Collector specific fields
    employee_code: Optional[str] = None
    organization: Optional[str] = None
    service_area: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    name: str
    email: str

class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None

class UserResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    phone: Optional[str] = None
    role: str
    points_balance: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class FirebaseVerifyRequest(BaseModel):
    id_token: str
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    otp_code: Optional[str] = None
    session_info: Optional[str] = None
    role: UserRoleEnum = UserRoleEnum.CITIZEN

class OtpSendRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15, description="Mobile number for WhatsApp OTP")

class OtpVerifyRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)
    code: str = Field(..., min_length=4, max_length=8)
    name: Optional[str] = None
    role: UserRoleEnum = UserRoleEnum.CITIZEN

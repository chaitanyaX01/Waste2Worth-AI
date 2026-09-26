import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User, Role, UserRoleEnum
from app.models.collector import Collector
from app.schemas.auth import UserRegister, UserLogin, Token, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    clean_email = user_in.email.strip().lower()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Validate compulsory 10-digit mobile phone number
    clean_phone = "".join(filter(str.isdigit, user_in.phone or ""))
    if len(clean_phone) != 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mobile phone number is compulsory and must be exactly 10 digits."
        )

    # Resolve role
    role = db.query(Role).filter(Role.name == user_in.role).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role {user_in.role} is invalid or not seeded."
        )

    new_user = User(
        name=user_in.name.strip(),
        email=clean_email,
        password_hash=hash_password(user_in.password),
        phone=clean_phone,
        role_id=role.id,
        points_balance=0,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # If role is COLLECTOR, create collector profile
    if user_in.role == UserRoleEnum.COLLECTOR:
        employee_code = user_in.employee_code or f"EMP-{uuid.uuid4().hex[:6].upper()}"
        collector_profile = Collector(
            user_id=new_user.id,
            employee_code=employee_code,
            organization=user_in.organization or "Municipal Waste Services",
            phone=clean_phone,
            service_area=user_in.service_area or "Central District",
            is_available=True
        )
        db.add(collector_profile)
        db.commit()

    token = create_access_token(subject=str(new_user.id), role=role.name.value)
    return Token(
        access_token=token,
        token_type="bearer",
        role=role.name.value,
        user_id=str(new_user.id),
        name=new_user.name,
        email=new_user.email
    )

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    clean_email = user_in.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated. Please contact an administrator."
        )

    token = create_access_token(subject=str(user.id), role=user.role.name.value)
    return Token(
        access_token=token,
        token_type="bearer",
        role=user.role.name.value,
        user_id=str(user.id),
        name=user.name,
        email=user.email
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        phone=current_user.phone,
        role=current_user.role.name.value,
        points_balance=current_user.points_balance,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )

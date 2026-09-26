import uuid
from typing import List, Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import decode_access_token
from app.models.user import User, UserRoleEnum, Role
from app.models.collector import Collector

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id_str: str = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account"
        )
    return user

def require_roles(allowed_roles: List[UserRoleEnum]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role_name = current_user.role.name.value if hasattr(current_user.role.name, "value") else str(current_user.role.name)
        allowed_role_names = [r.value if hasattr(r, "value") else str(r) for r in allowed_roles]
        
        if user_role_name not in allowed_role_names:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required role: {allowed_role_names}, your role: {user_role_name}"
            )
        return current_user
    return role_checker

def get_current_collector(
    current_user: User = Depends(require_roles([UserRoleEnum.COLLECTOR, UserRoleEnum.ADMIN])),
    db: Session = Depends(get_db)
) -> Collector:
    collector = db.query(Collector).filter(Collector.user_id == current_user.id).first()
    if not collector and current_user.role.name == UserRoleEnum.COLLECTOR:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collector profile not found for this user account"
        )
    return collector

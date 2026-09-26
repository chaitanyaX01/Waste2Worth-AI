from fastapi import APIRouter
from app.api.v1.predict import router as predict_router
from app.api.v1.auth import router as auth_router
from app.api.v1.citizen import router as citizen_router
from app.api.v1.collector import router as collector_router
from app.api.v1.admin import router as admin_router

api_router = APIRouter()

api_router.include_router(predict_router)
api_router.include_router(auth_router)
api_router.include_router(citizen_router)
api_router.include_router(collector_router)
api_router.include_router(admin_router)

import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import Base, engine
from app.services.ai_service import ai_service
from app.api.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables exist
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Database initialization warning: {e}")
    # Verify AI model is loaded
    print(f"Waste2Worth AI Model loaded on device: {ai_service.device}")
    yield

app = FastAPI(
    title="Waste2Worth AI Platform API",
    description="AI-Powered Community Waste Reporting, Classification & Rewards Platform",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Uploads Directory
uploads_path = Path(settings.UPLOAD_DIR)
uploads_path.mkdir(parents=True, exist_ok=True)
(uploads_path / "reports").mkdir(exist_ok=True)
(uploads_path / "evidence").mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

# Include Modular API Routers
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

# ==========================================
# PRESERVED BACKWARDS-COMPATIBLE ENDPOINTS
# ==========================================

@app.get("/")
def root():
    return {
        "message": "Waste2Worth AI Platform API is running",
        "status": "online",
        "version": "2.0.0",
        "docs_url": "/docs"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model": "loaded",
        "device": str(ai_service.device),
        "model_version": ai_service.model_version
    }

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Original preserved endpoint: Accepts image file and runs ResNet18 waste classification.
    """
    try:
        contents = await file.read()
        result = ai_service.predict(contents)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Classification failed: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
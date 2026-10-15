import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from fastapi import FastAPI, UploadFile, File, HTTPException, Response, Depends
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import Base, engine, get_db
from app.models.media import MediaFile
from app.services.ai_service import ai_service
from app.api.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables exist
    try:
        Base.metadata.create_all(bind=engine)
        print("Database schema tables verified.", flush=True)
    except Exception as e:
        print(f"Database initialization warning: {e}", flush=True)

    # Automatically seed essential database records (roles, badges, rewards)
    try:
        from seed_data import seed_database
        seed_database()
        print("Essential seed data verified (roles, badges, rewards catalog).", flush=True)
    except Exception as e:
        print(f"Database seeding notice: {e}", flush=True)

    # Startup complete
    print("Waste2Worth AI Platform API initialized (ready for requests).", flush=True)
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

# Uploads Directory Setup
uploads_path = Path(settings.UPLOAD_DIR)
uploads_path.mkdir(parents=True, exist_ok=True)
(uploads_path / "reports").mkdir(exist_ok=True)
(uploads_path / "evidence").mkdir(exist_ok=True)

def generate_waste_placeholder_svg(folder: str, filename: str) -> bytes:
    clean_folder = folder.replace("_", " ").title()
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a0c" />
      <stop offset="100%" stop-color="#141418" />
    </linearGradient>
    <linearGradient id="brand" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="url(#bg)" />
  <rect x="2" y="2" width="596" height="396" rx="20" stroke="#27272a" stroke-width="1.5" stroke-dasharray="6 6" />
  <circle cx="300" cy="165" r="46" fill="#18181b" stroke="#27272a" stroke-width="2" />
  <path d="M285 152h30l5 7h10c4.4 0 8 3.6 8 8v28c0 4.4-3.6 8-8 8H270c-4.4 0-8-3.6-8-8v-28c0-4.4 3.6-8 8-8h10l5-7z" stroke="url(#brand)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="300" cy="172" r="11" stroke="url(#brand)" stroke-width="2.5" />
  <text x="300" y="248" fill="#f4f4f5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600" text-anchor="middle" letter-spacing="0.5">Waste2Worth AI Evidence</text>
  <text x="300" y="272" fill="#71717a" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" text-anchor="middle">Community Report Record • {clean_folder}</text>
</svg>"""
    return svg.encode("utf-8")

@app.get("/uploads/{folder}/{filename}")
async def get_uploaded_media(folder: str, filename: str, db: Session = Depends(get_db)):
    """
    Persistent Media Handler:
    1. Returns directly from local disk cache if available.
    2. If missing (container restart, redeployment, or spin-down), pulls
       from Neon PostgreSQL persistent storage and re-hydrates disk cache.
    3. If unavailable in database, returns SVG placeholder with 200 OK
       preventing broken image errors across citizen, collector, and admin.
    """
    safe_folder = "evidence" if "evidence" in folder.lower() else "reports"
    safe_filename = Path(filename).name
    local_path = uploads_path / safe_folder / safe_filename

    # 1. Local disk cache hit
    if local_path.is_file() and local_path.stat().st_size > 0:
        return FileResponse(
            str(local_path),
            headers={"Cache-Control": "public, max-age=31536000, immutable"}
        )

    # 2. Database persistence hit (Neon PostgreSQL)
    media_id = f"{safe_folder}/{safe_filename}"
    media = db.query(MediaFile).filter(
        (MediaFile.id == media_id) |
        (MediaFile.filename == safe_filename) |
        (MediaFile.id.like(f"%{safe_filename}"))
    ).first()

    if media and media.data:
        try:
            local_path.parent.mkdir(parents=True, exist_ok=True)
            with open(local_path, "wb") as f:
                f.write(media.data)
        except Exception:
            pass

        return Response(
            content=media.data,
            media_type=media.content_type or "image/jpeg",
            headers={"Cache-Control": "public, max-age=31536000, immutable"}
        )

    # 3. Graceful SVG placeholder fallback
    svg_data = generate_waste_placeholder_svg(safe_folder, safe_filename)
    return Response(
        content=svg_data,
        media_type="image/svg+xml",
        headers={"Cache-Control": "public, max-age=3600"}
    )

@app.get("/uploads/{filename}")
async def get_uploaded_media_root(filename: str, db: Session = Depends(get_db)):
    return await get_uploaded_media("reports", filename, db)

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
@app.get("/api/health")
def health():
    is_loaded = ai_service._model is not None
    return {
        "status": "healthy",
        "model": "loaded" if is_loaded else "ready_on_demand",
        "device": str(ai_service._device) if ai_service._device else "cpu",
        "model_version": ai_service.model_version
    }

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Original preserved endpoint: Accepts image file and runs ResNet18 waste classification.
    """
    try:
        contents = await file.read()
        if len(contents) > 25 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds 25MB limit.")
        result = ai_service.predict(contents)
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"[PREDICT_ERROR] Failed to classify: {e}", flush=True)
        raise HTTPException(
            status_code=400,
            detail=f"Classification failed: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
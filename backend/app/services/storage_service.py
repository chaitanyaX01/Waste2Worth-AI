import os
import io
import uuid
import logging
from pathlib import Path
from typing import Optional, Tuple
import aiofiles
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from PIL import Image, ImageOps

try:
    import pillow_heif
    pillow_heif.register_heif_opener()
except Exception:
    pass

from app.core.config import settings

logger = logging.getLogger(__name__)

def optimize_image_bytes(raw_bytes: bytes, max_dim: int = 1200, quality: int = 82) -> Tuple[bytes, str]:
    """
    Downscales and compresses user-uploaded images to an optimized JPEG format.
    Transforms 5-15MB phone camera captures into clean ~80-120KB payloads for
    high-speed network transfer and persistent Neon PostgreSQL database storage.
    """
    try:
        with Image.open(io.BytesIO(raw_bytes)) as img:
            # Handle orientation EXIF metadata
            try:
                img = ImageOps.exif_transpose(img)
            except Exception:
                pass

            # Convert to RGB (handling transparency in RGBA/palette images)
            if img.mode in ("RGBA", "LA", "P"):
                bg = Image.new("RGB", img.size, (255, 255, 255))
                if img.mode == "P":
                    img = img.convert("RGBA")
                alpha_mask = img.split()[-1] if "A" in img.mode else None
                bg.paste(img, mask=alpha_mask)
                img = bg
            elif img.mode != "RGB":
                img = img.convert("RGB")

            # Constrain dimensions
            w, h = img.size
            if max(w, h) > max_dim:
                if w > h:
                    new_w = max_dim
                    new_h = int(h * (max_dim / w))
                else:
                    new_h = max_dim
                    new_w = int(w * (max_dim / h))
                img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

            out_buf = io.BytesIO()
            img.save(out_buf, format="JPEG", quality=quality, optimize=True)
            return out_buf.getvalue(), "image/jpeg"
    except Exception as e:
        logger.warning(f"Image optimization notice ({e}), storing raw bytes.")
        return raw_bytes, "image/jpeg"

class StorageService:
    def __init__(self):
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.reports_dir = self.upload_dir / "reports"
        self.evidence_dir = self.upload_dir / "evidence"
        
        self.reports_dir.mkdir(parents=True, exist_ok=True)
        self.evidence_dir.mkdir(parents=True, exist_ok=True)

    async def save_report_image(self, file: UploadFile, db: Optional[Session] = None) -> str:
        """
        Saves a citizen's waste report image to both local disk cache and persistent
        database storage so images never vanish across Render container restarts.
        """
        self._validate_image_file(file)
        unique_name = f"{uuid.uuid4().hex}.jpg"
        destination = self.reports_dir / unique_name

        contents = await file.read()
        await file.seek(0)

        optimized_bytes, content_type = optimize_image_bytes(contents)

        # 1. Save to local disk cache for immediate zero-latency serving
        try:
            async with aiofiles.open(destination, "wb") as f:
                await f.write(optimized_bytes)
        except Exception as e:
            logger.warning(f"Disk cache write warning: {e}")

        # 2. Persist directly into Neon PostgreSQL so Render sleep/restarts don't lose the photo
        media_id = f"reports/{unique_name}"
        self._persist_to_database(
            media_id=media_id,
            filename=unique_name,
            content_type=content_type,
            data=optimized_bytes,
            db=db
        )

        return f"/uploads/reports/{unique_name}"

    async def save_evidence_image(self, file: UploadFile, db: Optional[Session] = None) -> str:
        """
        Saves a collector's before/after collection proof image with dual disk-cache and
        persistent database storage.
        """
        self._validate_image_file(file)
        unique_name = f"{uuid.uuid4().hex}.jpg"
        destination = self.evidence_dir / unique_name

        contents = await file.read()
        await file.seek(0)

        optimized_bytes, content_type = optimize_image_bytes(contents)

        # 1. Local disk cache
        try:
            async with aiofiles.open(destination, "wb") as f:
                await f.write(optimized_bytes)
        except Exception as e:
            logger.warning(f"Disk cache write warning: {e}")

        # 2. Database persistence
        media_id = f"evidence/{unique_name}"
        self._persist_to_database(
            media_id=media_id,
            filename=unique_name,
            content_type=content_type,
            data=optimized_bytes,
            db=db
        )

        return f"/uploads/evidence/{unique_name}"

    def _persist_to_database(
        self,
        media_id: str,
        filename: str,
        content_type: str,
        data: bytes,
        db: Optional[Session] = None
    ):
        try:
            from app.models.media import MediaFile
            from app.core.database import SessionLocal

            def _save_record(s: Session):
                existing = s.query(MediaFile).filter(MediaFile.id == media_id).first()
                if existing:
                    existing.data = data
                    existing.file_size = len(data)
                    existing.content_type = content_type
                else:
                    record = MediaFile(
                        id=media_id,
                        filename=filename,
                        content_type=content_type,
                        data=data,
                        file_size=len(data)
                    )
                    s.add(record)
                s.commit()

            if db is not None:
                _save_record(db)
            else:
                with SessionLocal() as session:
                    _save_record(session)
        except Exception as e:
            logger.error(f"Failed to persist media '{media_id}' to database: {e}", exc_info=True)

    def _validate_image_file(self, file: UploadFile):
        if not file.content_type or not file.content_type.startswith("image/"):
            # Allow generic binary if extension is an image
            ext = self._get_extension(file)
            if ext not in [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"]:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid file format. Only JPEG, PNG, WebP, and HEIC images are allowed."
                )

    def _get_extension(self, file: UploadFile) -> str:
        filename = file.filename or "upload.jpg"
        ext = os.path.splitext(filename)[1].lower()
        if ext not in [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"]:
            return ".jpg"
        return ext

storage_service = StorageService()

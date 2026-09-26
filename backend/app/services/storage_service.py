import os
import uuid
import aiofiles
from pathlib import Path
from fastapi import UploadFile, HTTPException
from app.core.config import settings

class StorageService:
    def __init__(self):
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.reports_dir = self.upload_dir / "reports"
        self.evidence_dir = self.upload_dir / "evidence"
        
        self.reports_dir.mkdir(parents=True, exist_ok=True)
        self.evidence_dir.mkdir(parents=True, exist_ok=True)

    async def save_report_image(self, file: UploadFile) -> str:
        """
        Saves a citizen's waste report image and returns the relative URL path.
        """
        self._validate_image_file(file)
        ext = self._get_extension(file)
        unique_name = f"{uuid.uuid4().hex}{ext}"
        destination = self.reports_dir / unique_name

        contents = await file.read()
        await file.seek(0)  # Rewind so it can be re-read if needed

        async with aiofiles.open(destination, "wb") as f:
            await f.write(contents)

        return f"/uploads/reports/{unique_name}"

    async def save_evidence_image(self, file: UploadFile) -> str:
        """
        Saves a collector's before/after collection proof image.
        """
        self._validate_image_file(file)
        ext = self._get_extension(file)
        unique_name = f"{uuid.uuid4().hex}{ext}"
        destination = self.evidence_dir / unique_name

        contents = await file.read()
        await file.seek(0)

        async with aiofiles.open(destination, "wb") as f:
            await f.write(contents)

        return f"/uploads/evidence/{unique_name}"

    def _validate_image_file(self, file: UploadFile):
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail="Invalid file format. Only JPEG, PNG, and WebP images are allowed."
            )

    def _get_extension(self, file: UploadFile) -> str:
        filename = file.filename or "upload.jpg"
        ext = os.path.splitext(filename)[1].lower()
        if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
            return ".jpg"
        return ext

storage_service = StorageService()

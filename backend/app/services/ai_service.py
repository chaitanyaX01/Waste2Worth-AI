import io
import json
import logging
from pathlib import Path
from typing import Dict, Any, List

import torch
from torchvision import models, transforms
from PIL import Image

try:
    import pillow_heif
    pillow_heif.register_heif_opener()
except ImportError:
    pass

from app.core.config import settings

logger = logging.getLogger(__name__)

class AIService:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(AIService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        
        self.device = self._get_device()
        self.class_names: List[str] = self._load_class_names()
        self.model = self._load_model()
        self.transform = self._get_transforms()
        self.model_version = "ResNet18-Waste2Worth-v1.0"
        self._initialized = True
        logger.info(f"AIService initialized successfully on device: {self.device}")

    def _get_device(self) -> torch.device:
        if torch.backends.mps.is_available():
            device = torch.device("mps")
        elif torch.cuda.is_available():
            device = torch.device("cuda")
        else:
            device = torch.device("cpu")
        return device

    def _resolve_file_path(self, configured_path: str, default_filename: str) -> Path:
        candidates = [
            Path(configured_path),
            Path(__file__).resolve().parent.parent.parent.parent / default_filename,
            Path(__file__).resolve().parent.parent.parent / default_filename,
            Path.cwd() / default_filename,
            Path.cwd() / configured_path,
        ]
        for candidate in candidates:
            if candidate.exists() and candidate.is_file():
                return candidate
        raise FileNotFoundError(f"File '{default_filename}' not found. Checked: {[str(c) for c in candidates]}")

    def _load_class_names(self) -> List[str]:
        path = self._resolve_file_path(settings.CLASS_NAMES_PATH, "class_names.json")
        with open(path, "r", encoding="utf-8") as f:
            class_data = json.load(f)
        
        class_names = [class_data[str(i)] for i in range(len(class_data))]
        return class_names

    def _load_model(self) -> torch.nn.Module:
        path = self._resolve_file_path(settings.MODEL_PATH, "waste2worth_resnet18.pth")

        model = models.resnet18(weights=None)
        model.fc = torch.nn.Linear(model.fc.in_features, len(self.class_names))

        checkpoint = torch.load(path, map_location="cpu")
        if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
            model.load_state_dict(checkpoint["model_state_dict"])
        elif isinstance(checkpoint, dict) and "state_dict" in checkpoint:
            model.load_state_dict(checkpoint["state_dict"])
        else:
            model.load_state_dict(checkpoint)

        model.to(self.device)
        model.eval()
        return model

    def _get_transforms(self) -> transforms.Compose:
        return transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])

    def predict(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Executes inference on the given image bytes using the trained ResNet-18 model.
        Returns:
            dict containing:
                success: bool
                prediction: str (top class name)
                confidence: float (0.0 to 1.0)
                confidence_percent: float (0.0 to 100.0)
                all_predictions: dict mapping all 7 classes to their probabilities
                model_version: str
        """
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image_tensor = self.transform(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            outputs = self.model(image_tensor)
            probabilities = torch.softmax(outputs, dim=1)
            confidence, predicted = torch.max(probabilities, dim=1)

        predicted_class = self.class_names[predicted.item()]
        confidence_val = float(confidence.item())

        all_predictions = {}
        for i, prob in enumerate(probabilities[0]):
            all_predictions[self.class_names[i]] = round(float(prob.item()), 4)

        return {
            "success": True,
            "prediction": predicted_class,
            "confidence": round(confidence_val, 4),
            "confidence_percent": round(confidence_val * 100.0, 2),
            "all_predictions": all_predictions,
            "model_version": self.model_version
        }

# Global singleton helper
ai_service = AIService()

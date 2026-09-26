from typing import Dict
from pydantic import BaseModel, Field

class PredictionResponse(BaseModel):
    success: bool = True
    prediction: str = Field(..., description="Top classified waste class")
    confidence: float = Field(..., description="Confidence score between 0.0 and 1.0")
    confidence_percent: float = Field(..., description="Confidence percentage")
    all_predictions: Dict[str, float] = Field(..., description="Probabilities across all 7 classes")
    model_version: str = "ResNet18-Waste2Worth-v1.0"

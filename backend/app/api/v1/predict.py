from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.ai_service import ai_service
from app.schemas.ai import PredictionResponse

router = APIRouter(tags=["AI Prediction"])

@router.post("/predict", response_model=PredictionResponse)
async def predict_waste(file: UploadFile = File(...)):
    """
    Classifies uploaded waste image using the existing trained ResNet-18 model.
    Outputs the top predicted class, confidence percentage, and probabilities across all 7 classes.
    """
    try:
        contents = await file.read()
        if len(contents) > 25 * 1024 * 1024:  # 25 MB limit for high-res mobile photos
            raise HTTPException(
                status_code=400,
                detail="File size exceeds the 25MB limit."
            )

        result = ai_service.predict(contents)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Waste classification failed: {str(e)}"
        )

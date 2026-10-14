from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.services.prediction_service import prediction_service

router = APIRouter(prefix="/predictions", tags=["Predictive Waste Management"])

@router.get("/risk-forecast")
def get_risk_forecast(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Returns transparent waste accumulation risk forecast based on real historical
    and pending incident reports, time patterns, category hazards, and collection backlog.
    """
    return prediction_service.compute_risk_forecast(db)

@router.get("/hotspots")
def get_hotspot_locations(db: Session = Depends(get_db)):
    """
    Returns identified geographic waste hotspots with risk scores and category labels.
    """
    forecast = prediction_service.compute_risk_forecast(db)
    return forecast.get("high_risk_zones", [])

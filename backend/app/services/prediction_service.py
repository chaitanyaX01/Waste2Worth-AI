from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models.report import WasteReport, AIPrediction, ReportStatusEnum
from app.models.location import Location
from app.models.collector import CollectionTask, CollectionTaskStatusEnum

class PredictionService:
    """
    Predictive Waste Management Service.
    Evaluates real stored reports and computes transparent risk scores
    for waste accumulation hotspots, dispatch priority, and category trends.
    """

    MODEL_VERSION = "Accumulation-Risk-Baseline-v1.2"
    FORECAST_HORIZON = "24-48 Hours"

    CATEGORY_HAZARD_WEIGHTS = {
        "medical": 1.5,
        "e-waste": 1.3,
        "plastic": 1.15,
        "metal": 1.10,
        "glass": 1.05,
        "cardboard": 1.0,
        "paper": 1.0,
        "other": 1.0,
    }

    def compute_risk_forecast(self, db: Session) -> Dict[str, Any]:
        reports_query = db.query(
            WasteReport, Location, AIPrediction
        ).join(
            Location, WasteReport.location_id == Location.id
        ).outerjoin(
            AIPrediction, WasteReport.id == AIPrediction.report_id
        ).all()

        total_reports = len(reports_query)
        unresolved_reports = [r for r, _, _ in reports_query if r.status in [
            ReportStatusEnum.PENDING, ReportStatusEnum.VERIFIED, ReportStatusEnum.ASSIGNED, ReportStatusEnum.IN_PROGRESS
        ]]

        # Cluster by ~200m grid (3 decimal places is approx 110m)
        clusters: Dict[tuple, Dict[str, Any]] = {}
        now = datetime.now(timezone.utc)

        for rep, loc, pred in reports_query:
            key = (round(float(loc.latitude), 3), round(float(loc.longitude), 3))
            if key not in clusters:
                clusters[key] = {
                    "latitude": loc.latitude,
                    "longitude": loc.longitude,
                    "address": loc.address or f"Sector ({loc.latitude:.3f}, {loc.longitude:.3f})",
                    "total_count": 0,
                    "unresolved_count": 0,
                    "categories": {},
                    "oldest_unresolved_hours": 0.0,
                }

            clusters[key]["total_count"] += 1

            cat = (pred.predicted_class if pred else "other").lower()
            clusters[key]["categories"][cat] = clusters[key]["categories"].get(cat, 0) + 1

            if rep.status in [ReportStatusEnum.PENDING, ReportStatusEnum.VERIFIED, ReportStatusEnum.ASSIGNED, ReportStatusEnum.IN_PROGRESS]:
                clusters[key]["unresolved_count"] += 1
                age_hours = (now - rep.created_at.replace(tzinfo=timezone.utc)).total_seconds() / 3600.0
                if age_hours > clusters[key]["oldest_unresolved_hours"]:
                    clusters[key]["oldest_unresolved_hours"] = age_hours

        # Compute transparent risk score for each geographic cluster
        hotspot_zones: List[Dict[str, Any]] = []

        for key, data in clusters.items():
            unresolved = data["unresolved_count"]
            total = data["total_count"]
            categories = data["categories"]
            oldest_age = data["oldest_unresolved_hours"]

            # Factor 1: Backlog Volume Score (0 - 40 points)
            backlog_score = min(unresolved * 12.0, 40.0)

            # Factor 2: Hazard Severity Multiplier (0 - 25 points)
            max_hazard = 1.0
            dominant_cat = "mixed"
            max_cat_count = 0
            for c, cnt in categories.items():
                if cnt > max_cat_count:
                    max_cat_count = cnt
                    dominant_cat = c
                max_hazard = max(max_hazard, self.CATEGORY_HAZARD_WEIGHTS.get(c, 1.0))

            hazard_score = min((max_hazard - 1.0) * 50.0, 25.0)

            # Factor 3: Collection Latency Score (0 - 20 points)
            latency_score = min((oldest_age / 24.0) * 10.0, 20.0)

            # Factor 4: Repeat Reporting Frequency (0 - 15 points)
            repeat_score = min(total * 3.0, 15.0)

            composite_risk = round(backlog_score + hazard_score + latency_score + repeat_score, 1)
            composite_risk = min(max(composite_risk, 5.0), 100.0)

            # Priority recommendation
            if composite_risk >= 75.0:
                priority = "URGENT"
                reason = f"High unresolved backlog ({unresolved} incidents) with {dominant_cat} waste."
            elif composite_risk >= 50.0:
                priority = "HIGH"
                reason = f"Significant accumulation pressure with {unresolved} pending cleanups."
            elif composite_risk >= 25.0:
                priority = "MEDIUM"
                reason = "Moderate community reporting volume."
            else:
                priority = "LOW"
                reason = "Low waste accumulation detected."

            hotspot_zones.append({
                "latitude": data["latitude"],
                "longitude": data["longitude"],
                "address": data["address"],
                "report_count": total,
                "unresolved_count": unresolved,
                "dominant_category": dominant_cat,
                "risk_score": composite_risk,
                "priority_recommendation": priority,
                "priority_rationale": reason,
                "oldest_incident_hours": round(oldest_age, 1)
            })

        # Sort zones by descending risk score
        hotspot_zones.sort(key=lambda x: x["risk_score"], reverse=True)

        return {
            "model_version": self.MODEL_VERSION,
            "forecast_horizon": self.FORECAST_HORIZON,
            "model_type": "Transparent Risk-Scoring Baseline",
            "evaluation_notice": (
                "Predictions are calculated using transparent risk scoring based on "
                "real database incident density, category hazards, and collection latency."
            ),
            "scoring_weights": {
                "backlog_volume_weight": 0.40,
                "category_hazard_weight": 0.25,
                "collection_latency_weight": 0.20,
                "repeat_frequency_weight": 0.15
            },
            "summary": {
                "total_reports_analyzed": total_reports,
                "unresolved_reports": len(unresolved_reports),
                "total_active_clusters": len(clusters),
                "urgent_priority_clusters": sum(1 for z in hotspot_zones if z["priority_recommendation"] == "URGENT"),
            },
            "high_risk_zones": hotspot_zones[:15]
        }

prediction_service = PredictionService()

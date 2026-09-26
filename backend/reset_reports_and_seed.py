import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.core.database import SessionLocal
from app.models.report import WasteReport, AIPrediction, ReportStatusHistory
from app.models.collector import CollectionTask, CollectionTaskHistory, CollectionEvidence
from app.models.location import Location
from app.models.reward import RewardTransaction
from app.models.user import User
from seed_data import seed_database

def reset_and_reseed():
    db = SessionLocal()
    try:
        print("Cleaning up old mock reports and locations...")
        db.query(CollectionEvidence).delete()
        db.query(CollectionTaskHistory).delete()
        db.query(CollectionTask).delete()
        db.query(ReportStatusHistory).delete()
        db.query(AIPrediction).delete()
        db.query(RewardTransaction).delete()
        db.query(WasteReport).delete()
        db.query(Location).delete()

        # Reset citizen points balance to 150 so they can test rewards
        citizen = db.query(User).filter(User.email == "citizen@waste2worth.org").first()
        if citizen:
            citizen.points_balance = 150
            print(f"Citizen points balance set to: {citizen.points_balance}")

        db.commit()
        print("All mock reports and old locations successfully cleared!")
    except Exception as e:
        db.rollback()
        print(f"Error during cleanup: {e}")
        raise
    finally:
        db.close()

    # Re-seed the clean data and new rewards catalog
    print("\nRe-seeding with updated high-interest rewards catalog...")
    seed_database()

if __name__ == "__main__":
    reset_and_reseed()

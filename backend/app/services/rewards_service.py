import logging
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.reward import RewardTransaction, Badge, UserBadge
from app.models.report import WasteReport, ReportStatusEnum

logger = logging.getLogger(__name__)

class RewardsService:
    POINTS_SUBMIT_REPORT = 10
    POINTS_VERIFY_REPORT = 20
    POINTS_CLEANUP_COMPLETE = 50

    def award_points(
        self,
        db: Session,
        user_id,
        points: int,
        reason: str,
        report_id=None,
        task_id=None
    ) -> RewardTransaction:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found")

        user.points_balance += points
        transaction = RewardTransaction(
            user_id=user_id,
            report_id=report_id,
            task_id=task_id,
            points=points,
            reason=reason
        )
        db.add(transaction)
        db.commit()
        db.refresh(user)

        self.evaluate_badges(db, user_id)
        return transaction

    def evaluate_badges(self, db: Session, user_id):
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return

        total_reports = db.query(WasteReport).filter(WasteReport.citizen_id == user_id).count()
        completed_reports = db.query(WasteReport).filter(
            WasteReport.citizen_id == user_id,
            WasteReport.status == ReportStatusEnum.COMPLETED
        ).count()

        # Check badges
        earned_badge_ids = {
            ub.badge_id for ub in db.query(UserBadge).filter(UserBadge.user_id == user_id).all()
        }

        all_badges = db.query(Badge).all()
        for badge in all_badges:
            if badge.id in earned_badge_ids:
                continue

            should_earn = False
            if badge.name == "First Report" and total_reports >= 1:
                should_earn = True
            elif badge.name == "Eco Contributor" and total_reports >= 5:
                should_earn = True
            elif badge.name == "Community Cleaner" and completed_reports >= 3:
                should_earn = True
            elif badge.name == "Waste Warrior" and user.points_balance >= 100:
                should_earn = True

            if should_earn:
                user_badge = UserBadge(user_id=user_id, badge_id=badge.id)
                db.add(user_badge)
                logger.info(f"User {user.email} earned badge: {badge.name}")

        db.commit()

rewards_service = RewardsService()

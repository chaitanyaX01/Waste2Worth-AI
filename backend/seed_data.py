import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
import uuid

# Ensure backend root is on PYTHONPATH
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.core.database import Base, engine, SessionLocal
from app.core.security import hash_password
from app.models.user import User, Role, UserRoleEnum
from app.models.location import Location
from app.models.report import WasteReport, AIPrediction, ReportStatusHistory, ReportStatusEnum
from app.models.collector import (
    Collector,
    CollectionTask,
    CollectionTaskHistory,
    CollectionTaskStatusEnum,
    TaskPriorityEnum
)
from app.models.reward import Reward, RewardTransaction, Badge, UserBadge

def seed_database():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Roles
        print("Seeding roles...")
        roles_data = [
            (UserRoleEnum.CITIZEN, "Community citizen reporting waste and earning points"),
            (UserRoleEnum.COLLECTOR, "Field worker/sanitation team collecting reported waste"),
            (UserRoleEnum.ADMIN, "Municipal administrator managing operations, verification, and analytics")
        ]
        roles_map = {}
        for role_enum, desc in roles_data:
            role = db.query(Role).filter(Role.name == role_enum).first()
            if not role:
                role = Role(name=role_enum, description=desc)
                db.add(role)
                db.flush()
            roles_map[role_enum] = role

        # 2. Seed Default Badges
        print("Seeding badges...")
        badges_data = [
            ("First Report", "Report your first waste item in your community", "Submit 1 report", "flag"),
            ("Eco Contributor", "Regular contributor keeping our public spaces clean", "Submit 5 reports", "leaf"),
            ("Community Cleaner", "Witnessed 3 cleanups successfully completed", "Complete 3 cleanups", "shield-check"),
            ("Waste Warrior", "Champion of local environmental sustainability", "Earn 100+ eco points", "award")
        ]
        badges_map = {}
        for name, desc, req, icon in badges_data:
            badge = db.query(Badge).filter(Badge.name == name).first()
            if not badge:
                badge = Badge(name=name, description=desc, requirement=req, icon=icon)
                db.add(badge)
                db.flush()
            badges_map[name] = badge

        # 3. Seed Reward Catalog Items (High-Interest Civic Incentives)
        print("Seeding high-interest reward items...")
        rewards_data = [
            ("Free Artisanal Coffee", "Enjoy 1 handcrafted artisanal coffee or beverage at partner cafes", 40),
            ("Plant a Tree in Your Name", "Certified sapling planted by green initiative with personalized digital certificate", 50),
            ("Fast Food / Pizza Combo Voucher", "1 Personal pizza or meal combo coupon at partner food outlets", 60),
            ("City Metro / Bus Transit Pass", "Full day unlimited zero-emission public transit ride pass", 80),
            ("Movie Cinema Ticket Voucher", "1 Multiplex admit-one movie pass with popcorn voucher", 100),
            ("Spotify 1-Month Premium Code", "Digital streaming credit voucher for 1 month of ad-free music", 120),
            ("$10 Amazon Shopping Gift Card", "Instant $10 digital shopping e-gift card code delivered to your account", 150),
            ("Insulated Hydro Steel Flask (750ml)", "Sleek double-wall vacuum insulated stainless steel hot/cold water bottle", 200),
            ("Waste2Worth Eco Champion Hoodie & Cap", "Limited edition 100% organic cotton civic champion merchandise kit", 250)
        ]
        for name, desc, pts in rewards_data:
            existing_reward = db.query(Reward).filter(Reward.name == name).first()
            if not existing_reward:
                reward = Reward(name=name, description=desc, points_required=pts, is_active=True)
                db.add(reward)
            else:
                existing_reward.points_required = pts
                existing_reward.description = desc

        # 4. Seed Demo Users
        print("Seeding demo accounts...")
        # Admin
        admin_user = db.query(User).filter(User.email == "admin@waste2worth.org").first()
        if not admin_user:
            admin_user = User(
                name="Sarah Jenkins (Admin)",
                email="admin@waste2worth.org",
                password_hash=hash_password("admin123"),
                phone="+1-555-0199",
                role_id=roles_map[UserRoleEnum.ADMIN].id,
                points_balance=0,
                is_active=True
            )
            db.add(admin_user)
            db.flush()

        # Collector
        collector_user = db.query(User).filter(User.email == "collector@waste2worth.org").first()
        if not collector_user:
            collector_user = User(
                name="David Rodriguez",
                email="collector@waste2worth.org",
                password_hash=hash_password("collector123"),
                phone="+1-555-0142",
                role_id=roles_map[UserRoleEnum.COLLECTOR].id,
                points_balance=0,
                is_active=True
            )
            db.add(collector_user)
            db.flush()

            collector_profile = Collector(
                user_id=collector_user.id,
                employee_code="COL-101",
                organization="Metro Clean Sanitation Dept",
                phone="+1-555-0142",
                service_area="Downtown & East Sector",
                is_available=True
            )
            db.add(collector_profile)
            db.flush()
        else:
            collector_profile = db.query(Collector).filter(Collector.user_id == collector_user.id).first()

        # Citizen 1 (Pre-seeded with 150 points for rewards testing)
        citizen_user = db.query(User).filter(User.email == "citizen@waste2worth.org").first()
        if not citizen_user:
            citizen_user = User(
                name="Alex Morgan",
                email="citizen@waste2worth.org",
                password_hash=hash_password("citizen123"),
                phone="+1-555-0188",
                role_id=roles_map[UserRoleEnum.CITIZEN].id,
                points_balance=150,
                is_active=True
            )
            db.add(citizen_user)
            db.flush()
            db.add(UserBadge(user_id=citizen_user.id, badge_id=badges_map["First Report"].id))
        else:
            if citizen_user.points_balance < 100:
                citizen_user.points_balance = 150

        # Citizen 2
        citizen_2 = db.query(User).filter(User.email == "elena@waste2worth.org").first()
        if not citizen_2:
            citizen_2 = User(
                name="Elena Rostova",
                email="elena@waste2worth.org",
                password_hash=hash_password("citizen123"),
                phone="+1-555-0177",
                role_id=roles_map[UserRoleEnum.CITIZEN].id,
                points_balance=240,
                is_active=True
            )
            db.add(citizen_2)
            db.flush()
            db.add(UserBadge(user_id=citizen_2.id, badge_id=badges_map["First Report"].id))
            db.add(UserBadge(user_id=citizen_2.id, badge_id=badges_map["Eco Contributor"].id))
            db.add(UserBadge(user_id=citizen_2.id, badge_id=badges_map["Waste Warrior"].id))

        db.commit()
        print("Database seeded successfully with clean roles, users, badges, and high-interest rewards catalog (No mock reports).")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

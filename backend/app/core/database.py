import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings, BACKEND_DIR

logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

try:
    if "postgresql" in db_url:
        test_engine = create_engine(db_url, connect_args={"connect_timeout": 1})
        with test_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        engine = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20
        )
        logger.info("Connected to PostgreSQL database.")
    else:
        engine = create_engine(db_url, connect_args={"check_same_thread": False})
except Exception as e:
    logger.warning(f"Primary PostgreSQL offline or restricted ({e}). Using local SQLite database.")
    sqlite_path = BACKEND_DIR / "waste2worth.db"
    engine = create_engine(f"sqlite:///{sqlite_path}", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

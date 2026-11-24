from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# For SQLite, check_same_thread=False allows multiple threads (e.g. FastAPI worker threads)
connect_args = {"check_same_thread": False} if settings.SYNC_DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.SYNC_DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def ensure_schema_columns():
    try:
        inspector = inspect(engine)
        if "users" in inspector.get_table_names():
            cols = {c["name"] for c in inspector.get_columns("users")}
            with engine.begin() as conn:
                if "avatar_url" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(512)"))
                if "auth_provider" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'local'"))
    except Exception as e:
        print(f"Schema migration note: {e}")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

db_url = os.getenv("DATABASE_URL")

# Handle empty, missing, or literal interpolation strings
if db_url and db_url.strip() and not db_url.startswith("${"):
    SQLALCHEMY_DATABASE_URL = db_url.strip()
else:
    if db_url and db_url.startswith("${"):
        print(f"⚠️ WARNING: DATABASE_URL looks like an un-interpolated string: '{db_url}'")
        print("Check your DigitalOcean App Settings. Do not manually enter ${...} as the value.")
    db_dir = os.path.dirname(__file__)
    db_path = os.path.join(db_dir, "sql_app.db")
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"

# Debug logging (safe)
print(f"DATABASE_URL protocol: {SQLALCHEMY_DATABASE_URL.split(':', 1)[0]}, path: {SQLALCHEMY_DATABASE_URL.split('sqlite:///', 1)[-1]}")

# Fix for postgres:// issue (common in some hosting platforms)
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Engine setup
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,  # 🔥 important for production
    connect_args={"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}
)

# Enable WAL mode for SQLite
if "sqlite" in SQLALCHEMY_DATABASE_URL:
    from sqlalchemy import event
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
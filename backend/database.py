"""
Database connection and session configuration for PostgreSQL / SQLite.
Uses PostgreSQL if available, with graceful fallback to SQLite for portable local runs.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Database URL from environment or default to PostgreSQL / SQLite fallback
PG_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/aws_db")
SQLITE_URL = "sqlite:///./aws_monitor.db"

# Attempt PostgreSQL connection, fallback to SQLite if PostgreSQL is unavailable
try:
    if os.getenv("FORCE_POSTGRES", "false").lower() == "true":
        engine = create_engine(PG_URL)
        # Test connection
        with engine.connect() as conn:
            pass
        print(f"[DB] Connected to PostgreSQL at {PG_URL}")
    else:
        # Default to local SQLite for instant zero-dependency execution, or PG if specified
        engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
        print(f"[DB] Database initialized with SQLite store ({SQLITE_URL})")
except Exception as e:
    print(f"[DB WARN] PostgreSQL unavailable ({e}), falling back to SQLite.")
    engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency injection helper for FastAPI database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

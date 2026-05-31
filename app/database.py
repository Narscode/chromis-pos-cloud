"""
Database configuration.

The whole point of the cloud migration: the application code does NOT change
between local development and AWS. Only the DATABASE_URL environment variable
changes.

  Local dev  ->  mysql+pymysql://root@localhost/cloud_pos
  AWS (RDS)  ->  mysql+pymysql://admin:<password>@<rds-endpoint>:3306/cloud_pos

Set it via an environment variable (or a .env file). Nothing else needs editing.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Falls back to the original local connection string if no env var is set,
# so existing local development keeps working unchanged.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root@localhost/cloud_pos",
)

# SQLite uses check_same_thread=False, MySQL uses connection pool recycling.
if "sqlite" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
else:
    # pool_pre_ping recycles dead connections — important for managed databases
    # like Amazon RDS where idle connections can be dropped.
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=1800,
    )

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    """FastAPI dependency that yields a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


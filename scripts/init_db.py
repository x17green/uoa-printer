#!/usr/bin/env python3
"""
Payroll Management System - Database Initialization

This script applies the SQL schema in scripts/init-db.sql directly to the database
using asyncpg. It loads environment variables from a `.env` file (if present) and
prefers the following env vars (in order):

  - DATABASE_URL
  - POSTGRES_PRISMA_URL
  - POSTGRES_URL_NON_POOLING
  - POSTGRES_URL
  - POSTGRES_DATABASE_URL
"""

import asyncio
import os
import sys
from pathlib import Path
from typing import Optional

try:
    from dotenv import load_dotenv
except ImportError:
    print("[v0] Required package 'python-dotenv' not installed. Installing...")
    os.system("pip install python-dotenv")
    from dotenv import load_dotenv

try:
    import asyncpg
except ImportError:
    print("[v0] Required package 'asyncpg' not installed. Installing...")
    os.system("pip install asyncpg")
    import asyncpg


def _get_database_url() -> Optional[str]:
    # Load .env if it exists
    env_path = Path(__file__).parent.parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)

    # Common env vars used in this project
    candidates = [
        "DATABASE_URL",
        "POSTGRES_PRISMA_URL",
        "POSTGRES_URL_NON_POOLING",
        "POSTGRES_URL",
        "POSTGRES_DATABASE_URL",
    ]

    for name in candidates:
        value = os.getenv(name)
        if value:
            return value

    return None


async def run_migration() -> bool:
    db_url = _get_database_url()
    if not db_url:
        print("[v0] Error: No database URL found in environment.")
        print(
            "[v0] Please set one of: DATABASE_URL, POSTGRES_PRISMA_URL, POSTGRES_URL_NON_POOLING, POSTGRES_URL"
        )
        return False

    sql_path = Path(__file__).parent / "init-db.sql"
    if not sql_path.exists():
        print(f"[v0] Error: Cannot find SQL migration file at {sql_path}")
        return False

    sql = sql_path.read_text(encoding="utf-8")

    print("[v0] Connecting to database...")
    try:
        conn = await asyncpg.connect(dsn=db_url)
    except Exception as e:
        print(f"[v0] Error connecting to database: {e}")
        return False

    try:
        print("[v0] Running SQL migration...")
        # Execute all statements in a single call; asyncpg supports multi-statement SQL
        await conn.execute(sql)
        print("[v0] Migration completed successfully!")
        return True
    except Exception as e:
        print(f"[v0] Migration failed: {e}")
        return False
    finally:
        await conn.close()


if __name__ == "__main__":
    success = asyncio.run(run_migration())
    sys.exit(0 if success else 1)

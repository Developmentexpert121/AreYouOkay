"""
Production Fix: Add missing columns to PostgreSQL and ensure data integrity.
This script can be run directly on the DigitalOcean App Console.
It handles the schema changes (ALTER TABLE) that a standard seeder can't do.
"""
import os
import sys
import psycopg2
from dotenv import load_dotenv

# Load env in case it's run locally (but intended for DO console)
load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable is missing.")
    sys.exit(1)

# Ensure correct protocol for psycopg2
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

def fix_database():
    print("Connecting to production database...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cur = conn.cursor()

        # 1. Check existing columns in the 'users' table
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        """)
        existing_columns = {row[0] for row in cur.fetchall()}
        print(f"Current columns in 'users' table: {existing_columns}")

        # 2. Add missing columns if they don't exist
        columns_to_add = {
            "email_verified": "BOOLEAN DEFAULT FALSE NOT NULL",
            "email_verification_token": "TEXT",
            "email_verification_expires": "TIMESTAMP"
        }

        for col, definition in columns_to_add.items():
            if col not in existing_columns:
                print(f"Adding column: {col}...")
                cur.execute(f"ALTER TABLE users ADD COLUMN {col} {definition};")
                print(f"Column {col} added successfully.")
            else:
                print(f"Column {col} already exists.")

        # 3. Data integrity: Ensure all existing users are marked as verified
        # (Otherwise old users won't be able to login)
        print("Ensuring existing users are marked as verified...")
        cur.execute("UPDATE users SET email_verified = TRUE WHERE email_verified IS FALSE OR email_verified IS NULL;")
        print(f"Updated {cur.rowcount} existing users.")

        print("\n[SUCCESS] Production database is now up to date!")
        cur.close()
        conn.close()

    except Exception as e:
        print(f"\n[ERROR] Failed to fix database: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    fix_database()

"""
PROD SEEDER & FIX: Adds missing columns AND seeds a test user.
To run on DigitalOcean Console: python python/seed_db.py
"""
import os
import sys
import psycopg2
import bcrypt
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found. Run this on DigitalOcean Console.")
    sys.exit(1)

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

def hash_pw(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def run_seed():
    print("Connecting to production DB...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cur = conn.cursor()

        # 1. FIX SCHEMA
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'users';")
        existing = {row[0] for row in cur.fetchall()}
        
        needed = {
            "email_verified": "BOOLEAN DEFAULT FALSE NOT NULL",
            "email_verification_token": "TEXT",
            "email_verification_expires": "TIMESTAMP"
        }

        for col, definition in needed.items():
            if col not in existing:
                print(f"Adding column: {col}...")
                cur.execute(f"ALTER TABLE users ADD COLUMN {col} {definition};")
                print(f"SUCCESS: {col} added.")

        # 2. FIX EXISTING DATA
        print("Ensuring existing users are verified...")
        cur.execute("UPDATE users SET email_verified = TRUE WHERE email_verified IS FALSE OR email_verified IS NULL;")
        print(f"Updated {cur.rowcount} existing users.")

        # 3. SEED TEST USER
        test_email = "test@example.com"
        # Check if test user exists
        cur.execute("SELECT id FROM users WHERE email = %s;", (test_email,))
        if not cur.fetchone():
            print(f"Seeding test user: {test_email}...")
            hashed = hash_pw("Password123!")
            cur.execute("""
                INSERT INTO users (name, email, hashed_password, email_verified, created_at)
                VALUES (%s, %s, %s, %s, %s);
            """, ("Test User", test_email, hashed, True, datetime.utcnow()))
            print("SUCCESS: Test user added (Password: Password123!)")
        else:
            print("OK: Test user already exists.")

        print("\n=== DATABASE SEEDED AND FIXED! ===")
        cur.close()
        conn.close()

    except Exception as e:
        print(f"\nCRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_seed()

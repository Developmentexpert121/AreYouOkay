"""
Production migration: Add email verification columns to PostgreSQL users table.
Reads DATABASE_URL from environment (set on DigitalOcean App Platform).
Safe to run multiple times - skips columns that already exist.
"""
import os
import sys

try:
    import psycopg2
except ImportError:
    print("Installing psycopg2-binary...")
    os.system(f"{sys.executable} -m pip install psycopg2-binary")
    import psycopg2

from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable not set.")
    sys.exit(1)

# psycopg2 needs 'postgresql://' not 'postgres://'
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

print(f"Connecting to database...")

conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = False
cur = conn.cursor()

try:
    # Check which columns already exist
    cur.execute("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'users'
    """)
    existing = {row[0] for row in cur.fetchall()}
    print(f"Existing columns: {sorted(existing)}")

    added = []

    if "email_verified" not in existing:
        cur.execute("ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT false")
        added.append("email_verified")
        print("[+] Added: email_verified")

    if "email_verification_token" not in existing:
        cur.execute("ALTER TABLE users ADD COLUMN email_verification_token TEXT")
        added.append("email_verification_token")
        print("[+] Added: email_verification_token")

    if "email_verification_expires" not in existing:
        cur.execute("ALTER TABLE users ADD COLUMN email_verification_expires TIMESTAMP")
        added.append("email_verification_expires")
        print("[+] Added: email_verification_expires")

    # Mark ALL existing users as verified so they don't get locked out
    cur.execute("UPDATE users SET email_verified = true WHERE email_verified = false OR email_verified IS NULL")
    updated = cur.rowcount
    print(f"[✓] Marked {updated} existing users as email_verified = true")

    conn.commit()

    if added:
        print(f"\n[OK] Migration complete. Added: {', '.join(added)}")
    else:
        print("\n[INFO] All columns already exist. Nothing to add.")

except Exception as e:
    conn.rollback()
    print(f"\n[ERROR] Migration failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
finally:
    cur.close()
    conn.close()

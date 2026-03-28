"""
One-time migration: Add email verification columns to the users table.
Safe to run multiple times (uses IF NOT EXISTS checks for SQLite).
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "sql_app.db")

def run_migration():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check existing columns
    cursor.execute("PRAGMA table_info(users)")
    existing = {row[1] for row in cursor.fetchall()}
    print(f"Existing columns: {existing}")

    added = []

    if "email_verified" not in existing:
        cursor.execute("ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 0 NOT NULL")
        added.append("email_verified")

    if "email_verification_token" not in existing:
        cursor.execute("ALTER TABLE users ADD COLUMN email_verification_token TEXT")
        added.append("email_verification_token")

    if "email_verification_expires" not in existing:
        cursor.execute("ALTER TABLE users ADD COLUMN email_verification_expires DATETIME")
        added.append("email_verification_expires")

    # Mark all EXISTING users as verified so they don't get locked out
    cursor.execute("UPDATE users SET email_verified = 1 WHERE email_verified = 0 OR email_verified IS NULL")
    updated = cursor.rowcount

    conn.commit()
    conn.close()

    if added:
        print(f"[OK] Added columns: {', '.join(added)}")
    else:
        print("[INFO] All columns already exist, nothing to add.")

    print(f"[OK] Marked {updated} existing users as email_verified=1 (they registered before verification was required).")
    print("Migration complete.")
    print("Migration complete.")

if __name__ == "__main__":
    run_migration()

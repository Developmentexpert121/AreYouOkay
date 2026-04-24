import sqlite3
from datetime import datetime

conn = sqlite3.connect('c:/Users/Pc/Desktop/AreYouOkay/python/sql_app.db')
cursor = conn.cursor()

print("Checking for multiple active check-ins for the same user:")
cursor.execute("""
    SELECT user_id, COUNT(*) as count 
    FROM check_ins 
    WHERE status NOT IN ('completed', 'missed', 'emergency_acknowledged')
    GROUP BY user_id
    HAVING count > 1
""")
rows = cursor.fetchall()
for row in rows:
    print(f"User ID {row[0]} has {row[1]} active check-ins.")
    cursor.execute("""
        SELECT id, scheduled_for, status FROM check_ins 
        WHERE user_id = ? AND status NOT IN ('completed', 'missed', 'emergency_acknowledged')
        ORDER BY scheduled_for DESC
    """, (row[0],))
    checkins = cursor.fetchall()
    for c in checkins:
        print(f"  Check-in ID: {c[0]}, Scheduled: {c[1]}, Status: {c[2]}")

print("\nRecent Check-ins:")
cursor.execute("SELECT id, user_id, scheduled_for, status FROM check_ins ORDER BY id DESC LIMIT 10")
for row in cursor.fetchall():
    print(row)

conn.close()

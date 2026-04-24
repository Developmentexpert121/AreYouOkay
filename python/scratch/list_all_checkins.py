import sqlite3
from datetime import datetime

conn = sqlite3.connect('c:/Users/Pc/Desktop/AreYouOkay/python/sql_app.db')
cursor = conn.cursor()

cursor.execute("SELECT id, user_id, scheduled_for, status FROM check_ins ORDER BY user_id, scheduled_for")
for row in cursor.fetchall():
    print(row)

conn.close()

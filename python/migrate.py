import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'sql_app.db')
conn = sqlite3.connect(db_path)
c = conn.cursor()

def add_column(table, column, type_def):
    try:
        c.execute(f"ALTER TABLE {table} ADD COLUMN {column} {type_def}")
        print(f"Added {column} to {table}")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print(f"Column {column} already exists in {table}")
        else:
            print(f"Error adding {column}: {e}")

add_column("users", "emergency_contact_name_2", "VARCHAR")
add_column("users", "emergency_contact_phone_2", "VARCHAR")
add_column("users", "emergency_contact_name_3", "VARCHAR")
add_column("users", "emergency_contact_phone_3", "VARCHAR")

conn.commit()
conn.close()
print("Migration completed.")

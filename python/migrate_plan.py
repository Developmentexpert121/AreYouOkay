import sqlite3
import os

# Check both possible database names
db_paths = [
    os.path.join(os.path.dirname(__file__), 'sql_app.db'),
    os.path.join(os.path.dirname(__file__), 'safe_check.db')
]

for db_path in db_paths:
    if not os.path.exists(db_path):
        continue
        
    print(f"Migrating database: {db_path}")
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

    add_column("users", "plan_type", "VARCHAR")

    conn.commit()
    conn.close()

print("Migration completed.")

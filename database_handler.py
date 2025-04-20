import sqlite3
import pandas as pd

class ProgressTrackerDB:
    def __init__(self, db_name="progress_tracker.db"):
        self.db_name = db_name
        self.conn = None
        self.cursor = None

    def connect(self):
        """Connect to the SQLite database."""
        self.conn = sqlite3.connect(self.db_name)
        self.cursor = self.conn.cursor()

    def disconnect(self):
        """Disconnect from the SQLite database."""
        if self.conn:
            self.conn.close()
            self.conn = None
            self.cursor = None

    def initialize_db(self):
        """Initialize the database with the necessary table."""
        self.connect()
        try:
            self.cursor.execute("""
                CREATE TABLE IF NOT EXISTS progress (
                    section TEXT PRIMARY KEY,
                    started_checked INTEGER,
                    completed_checked INTEGER,
                    completion_percentage REAL
                )
            """)
            self.conn.commit()
        except sqlite3.Error as e:
            print(f"Error initializing database: {e}")
        finally:
            self.disconnect()

    def save_data(self, section_data):
        """Save section data to the database."""
        self.connect()
        try:
            for section, data in section_data.items():
                self.cursor.execute("""
                    INSERT OR REPLACE INTO progress (section, started_checked, completed_checked, completion_percentage)
                    VALUES (?, ?, ?, ?)
                """, (section, data['started_checked'], data['completed_checked'], data['completion_percentage']))
            self.conn.commit()
        except sqlite3.Error as e:
            print(f"Error saving data: {e}")
        finally:
            self.disconnect()

    def load_data(self):
        """Load all data from the database and return as a dictionary."""
        self.connect()
        try:
            self.cursor.execute("SELECT * FROM progress")
            rows = self.cursor.fetchall()
            data = {}
            for row in rows:
                data[row[0]] = {
                    'started_checked': row[1],
                    'completed_checked': row[2],
                    'completion_percentage': row[3]
                }
            return data
        except sqlite3.Error as e:
            print(f"Error loading data: {e}")
            return {}
        finally:
            self.disconnect()

def main():
    """Example usage of the ProgressTrackerDB class."""
    db = ProgressTrackerDB()
    db.initialize_db()

    # Example data to save
    sample_data = {
        "Notes": {'started_checked': 1, 'completed_checked': 0, 'completion_percentage': 50.0},
        "Focused Study Sessions": {'started_checked': 0, 'completed_checked': 0, 'completion_percentage': 0.0},
        "YouTube Links": {'started_checked': 1, 'completed_checked': 1, 'completion_percentage': 100.0},
         "More Links": {'started_checked': 1, 'completed_checked': 1, 'completion_percentage': 100.0}
    }

    # Save data
    db.save_data(sample_data)

    # Load and print data
    loaded_data = db.load_data()
    print("Loaded Data:")
    print(loaded_data)

if __name__ == "__main__":
    main()
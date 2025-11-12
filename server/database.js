const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Define the database file path
const dbPath = path.resolve(__dirname, 'hospital.db');

// Create or connect to the SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Initialize tables
const initializeTables = () => {
    db.serialize(() => {
        // Create patients table
        db.run(`
            CREATE TABLE IF NOT EXISTS patients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                age INTEGER,
                gender TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create calls table
        db.run(`
            CREATE TABLE IF NOT EXISTS calls (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id INTEGER,
                status TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES patients (id)
            )
        `);

        console.log('Tables initialized successfully.');
    });
};

// Initialize the database tables
initializeTables();

module.exports = db;
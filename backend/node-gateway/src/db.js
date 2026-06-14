const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'app.db');

// Ensure data directory exists
const fs = require('fs');
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// --- SCHEMA ---
db.exec(`
  CREATE TABLE IF NOT EXISTS volunteers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone TEXT,
    age INTEGER,
    city TEXT,
    skills TEXT,
    availability TEXT,
    role TEXT NOT NULL DEFAULT 'volunteer',
    status TEXT NOT NULL DEFAULT 'pending',
    approved_at TEXT,
    approved_by INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    event_date TEXT NOT NULL,
    location TEXT,
    city TEXT,
    max_capacity INTEGER,
    status TEXT NOT NULL DEFAULT 'upcoming',
    created_by INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS event_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    volunteer_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'registered',
    hours_logged REAL,
    registered_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(event_id, volunteer_id),
    FOREIGN KEY(event_id) REFERENCES events(id),
    FOREIGN KEY(volunteer_id) REFERENCES volunteers(id)
  );

  CREATE TABLE IF NOT EXISTS branches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT,
    head_volunteer_id INTEGER,
    contact_email TEXT,
    contact_phone TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    founded_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER,
    school TEXT,
    grade TEXT,
    guardian_name TEXT,
    guardian_phone TEXT,
    city TEXT,
    branch_id INTEGER,
    assigned_volunteer_id INTEGER,
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS teaching_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    volunteer_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    session_date TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(volunteer_id) REFERENCES volunteers(id),
    FOREIGN KEY(student_id) REFERENCES students(id)
  );

  CREATE TABLE IF NOT EXISTS donations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    donor_name TEXT NOT NULL,
    donor_email TEXT,
    donor_phone TEXT,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    campaign TEXT,
    payment_method TEXT,
    receipt_number TEXT,
    pan_number TEXT,
    status TEXT NOT NULL DEFAULT 'completed',
    notes TEXT,
    donation_date TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    target_entity TEXT NOT NULL,
    target_id INTEGER,
    details TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS faqs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT
  );

  CREATE TABLE IF NOT EXISTS chat_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    volunteer_id INTEGER,
    question TEXT NOT NULL,
    matched_faq_id INTEGER,
    response_source TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = db;

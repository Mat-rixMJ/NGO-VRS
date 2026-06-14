const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const db = require('./db');
const seed = require('./seed');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_production_32chars';

// Security
app.use(helmet({ contentSecurityPolicy: false }));
const ALLOWED_ORIGIN = process.env.FRONTEND_URL || '*';
app.use(cors({ origin: ALLOWED_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate Limiters
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many attempts' } } });
const chatbotLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Slow down' } } });
app.use('/api/', rateLimit({ windowMs: 60 * 1000, max: 100 }));

// --- HEALTH ---
app.get('/health', (req, res) => {
  const count = db.prepare('SELECT COUNT(*) as c FROM volunteers').get().c;
  res.json({ status: 'ok', uptime: process.uptime(), volunteers: count, timestamp: new Date().toISOString() });
});

// --- AUTH MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Access token required' } });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Invalid or expired token' } });
    req.user = user;
    next();
  });
};
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
  next();
};

// ==================== AUTH ====================

app.post('/api/auth/signup', authLimiter, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: errors.array()[0].msg } });

  const { name, email, password, phone, age, city, skills, availability, role } = req.body;
  const existing = db.prepare('SELECT id FROM volunteers WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: { code: 'EMAIL_EXISTS', message: 'Email already registered' } });

  const hash = bcrypt.hashSync(password, 10);
  const r = role === 'admin' ? 'admin' : 'volunteer';
  const s = r === 'admin' ? 'active' : 'pending';
  const result = db.prepare(`INSERT INTO volunteers (name, email, password_hash, phone, age, city, skills, availability, role, status) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(name, email, hash, phone || null, age ? parseInt(age) : null, city || null, skills || null, availability || null, r, s);
  res.status(201).json({ message: 'Account created successfully', id: result.lastInsertRowid });
});

app.post('/api/auth/login', authLimiter, [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: errors.array()[0].msg } });

  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM volunteers WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
  if (!bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.post('/api/auth/forgot-password', authLimiter, [body('email').isEmail().normalizeEmail()], (req, res) => {
  const { email } = req.body;
  const user = db.prepare('SELECT id, email FROM volunteers WHERE email = ?').get(email);
  if (user) {
    const resetToken = jwt.sign({ id: user.id, email: user.email, purpose: 'password_reset' }, JWT_SECRET, { expiresIn: '1h' });
    console.log(`[RESET TOKEN] ${email}: ${resetToken}`);
    return res.json({ message: 'If registered, a reset link has been sent.', ...(process.env.NODE_ENV !== 'production' && { resetToken }) });
  }
  res.json({ message: 'If registered, a reset link has been sent.' });
});

app.post('/api/auth/reset-password', [body('token').notEmpty(), body('newPassword').isLength({ min: 8 })], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: errors.array()[0].msg } });
  try {
    const decoded = jwt.verify(req.body.token, JWT_SECRET);
    if (decoded.purpose !== 'password_reset') throw new Error();
    const hash = bcrypt.hashSync(req.body.newPassword, 10);
    db.prepare('UPDATE volunteers SET password_hash = ? WHERE id = ?').run(hash, decoded.id);
    res.json({ message: 'Password reset successfully' });
  } catch { res.status(400).json({ error: { code: 'INVALID_TOKEN', message: 'Token invalid or expired' } }); }
});

// ==================== VOLUNTEER PROFILE ====================

app.get('/api/volunteers/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id,name,email,phone,age,city,skills,availability,role,status,created_at FROM volunteers WHERE id=?').get(req.user.id);
  if (!user) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Profile not found' } });
  res.json(user);
});

app.put('/api/volunteers/me', authenticateToken, (req, res) => {
  const { name, phone, age, city, skills, availability } = req.body;
  db.prepare(`UPDATE volunteers SET name=COALESCE(?,name), phone=COALESCE(?,phone), age=COALESCE(?,age), city=COALESCE(?,city), skills=COALESCE(?,skills), availability=COALESCE(?,availability) WHERE id=?`)
    .run(name, phone, age ? parseInt(age) : null, city, skills, availability, req.user.id);
  const updated = db.prepare('SELECT id,name,email,phone,age,city,skills,availability,role,status,created_at FROM volunteers WHERE id=?').get(req.user.id);
  res.json(updated);
});

// ==================== ADMIN VOLUNTEERS ====================

app.get('/api/volunteers', authenticateToken, requireAdmin, (req, res) => {
  const { search, city, skill, page, limit } = req.query;
  let query = 'SELECT id,name,email,phone,age,city,skills,availability,role,status,created_at FROM volunteers WHERE 1=1';
  const params = [];
  if (search) { query += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (city) { query += ' AND city = ?'; params.push(city); }
  if (skill) { query += ' AND skills LIKE ?'; params.push(`%${skill}%`); }
  query += ' ORDER BY created_at DESC';

  const all = db.prepare(query).all(...params);
  if (page && limit) {
    const p = Math.max(parseInt(page), 1);
    const l = Math.max(parseInt(limit), 1);
    const start = (p - 1) * l;
    return res.json({ total: all.length, page: p, limit: l, results: all.slice(start, start + l) });
  }
  res.json(all);
});

app.get('/api/volunteers/:id', authenticateToken, requireAdmin, (req, res) => {
  const v = db.prepare('SELECT id,name,email,phone,age,city,skills,availability,role,status,approved_at,approved_by,created_at FROM volunteers WHERE id=?').get(req.params.id);
  if (!v) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Volunteer not found' } });
  res.json(v);
});

app.put('/api/volunteers/:id/status', authenticateToken, requireAdmin, (req, res) => {
  const { status } = req.body;
  if (!['pending', 'approved', 'active', 'inactive'].includes(status)) return res.status(400).json({ error: { code: 'INVALID', message: 'Invalid status' } });
  const approvedAt = ['approved', 'active'].includes(status) ? new Date().toISOString() : null;
  db.prepare('UPDATE volunteers SET status=?, approved_at=COALESCE(?,approved_at), approved_by=? WHERE id=?').run(status, approvedAt, req.user.id, req.params.id);
  const v = db.prepare('SELECT id,name,email,status,approved_at,approved_by FROM volunteers WHERE id=?').get(req.params.id);
  res.json(v);
});

app.delete('/api/volunteers/:id', authenticateToken, requireAdmin, (req, res) => {
  const r = db.prepare('DELETE FROM volunteers WHERE id=?').run(req.params.id);
  if (r.changes === 0) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Volunteer not found' } });
  res.json({ message: 'Deleted' });
});

// ==================== ANALYTICS ====================

app.get('/api/analytics/summary', authenticateToken, requireAdmin, (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as c FROM volunteers').get().c;
  const newThisWeek = db.prepare("SELECT COUNT(*) as c FROM volunteers WHERE created_at >= datetime('now','-7 days')").get().c;
  const newThisMonth = db.prepare("SELECT COUNT(*) as c FROM volunteers WHERE created_at >= datetime('now','-30 days')").get().c;
  res.json({ total, newThisWeek, newThisMonth });
});

app.get('/api/analytics/trends', authenticateToken, requireAdmin, (req, res) => {
  const signupsOverTime = db.prepare("SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count FROM volunteers GROUP BY month ORDER BY month").all();
  const byCity = db.prepare("SELECT city, COUNT(*) as count FROM volunteers WHERE city IS NOT NULL GROUP BY city ORDER BY count DESC").all();
  const bySkill = (() => {
    const rows = db.prepare("SELECT skills FROM volunteers WHERE skills IS NOT NULL AND skills != ''").all();
    const map = {};
    rows.forEach(r => r.skills.split(',').forEach(s => { const k = s.trim(); if (k) map[k] = (map[k] || 0) + 1; }));
    return Object.entries(map).map(([skill, count]) => ({ skill, count })).sort((a, b) => b.count - a.count);
  })();
  const byAgeBand = (() => {
    const rows = db.prepare("SELECT age FROM volunteers WHERE age IS NOT NULL").all();
    const bands = { 'Under 18': 0, '18-25': 0, '26-35': 0, '36+': 0 };
    rows.forEach(r => { if (r.age < 18) bands['Under 18']++; else if (r.age <= 25) bands['18-25']++; else if (r.age <= 35) bands['26-35']++; else bands['36+']++; });
    return Object.entries(bands).map(([band, count]) => ({ band, count }));
  })();
  res.json({ signupsOverTime, byCity, bySkill, byAgeBand });
});

// ==================== EVENTS ====================

app.get('/api/events', authenticateToken, (req, res) => {
  const { status } = req.query;
  let events;
  if (status) events = db.prepare('SELECT * FROM events WHERE status=? ORDER BY event_date DESC').all(status);
  else events = db.prepare('SELECT * FROM events ORDER BY event_date DESC').all();
  const enriched = events.map(e => ({ ...e, registeredCount: db.prepare('SELECT COUNT(*) as c FROM event_registrations WHERE event_id=?').get(e.id).c }));
  res.json(enriched);
});

app.get('/api/events/:id', authenticateToken, (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id=?').get(req.params.id);
  if (!event) return res.status(404).json({ error: { message: 'Event not found' } });
  const registrations = db.prepare('SELECT er.*, v.name as volunteer_name FROM event_registrations er JOIN volunteers v ON er.volunteer_id=v.id WHERE er.event_id=?').all(req.params.id);
  res.json({ event, registrations, registeredCount: registrations.length });
});

app.post('/api/events', authenticateToken, requireAdmin, (req, res) => {
  const { title, description, type, eventDate, location, city, maxCapacity } = req.body;
  if (!title || !type || !eventDate) return res.status(400).json({ error: { message: 'title, type, eventDate required' } });
  const r = db.prepare('INSERT INTO events (title,description,type,event_date,location,city,max_capacity,created_by) VALUES (?,?,?,?,?,?,?,?)').run(title, description, type, eventDate, location, city, maxCapacity, req.user.id);
  res.status(201).json(db.prepare('SELECT * FROM events WHERE id=?').get(r.lastInsertRowid));
});

app.put('/api/events/:id', authenticateToken, requireAdmin, (req, res) => {
  const { title, description, type, eventDate, location, city, maxCapacity, status } = req.body;
  db.prepare('UPDATE events SET title=COALESCE(?,title),description=COALESCE(?,description),type=COALESCE(?,type),event_date=COALESCE(?,event_date),location=COALESCE(?,location),city=COALESCE(?,city),max_capacity=COALESCE(?,max_capacity),status=COALESCE(?,status) WHERE id=?')
    .run(title, description, type, eventDate, location, city, maxCapacity, status, req.params.id);
  res.json(db.prepare('SELECT * FROM events WHERE id=?').get(req.params.id));
});

app.delete('/api/events/:id', authenticateToken, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM event_registrations WHERE event_id=?').run(req.params.id);
  db.prepare('DELETE FROM events WHERE id=?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

app.post('/api/events/:id/register', authenticateToken, (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id=?').get(req.params.id);
  if (!event) return res.status(404).json({ error: { message: 'Event not found' } });
  const existing = db.prepare('SELECT id FROM event_registrations WHERE event_id=? AND volunteer_id=?').get(req.params.id, req.user.id);
  if (existing) return res.status(409).json({ error: 'Already registered' });
  if (event.max_capacity) { const c = db.prepare('SELECT COUNT(*) as c FROM event_registrations WHERE event_id=?').get(req.params.id).c; if (c >= event.max_capacity) return res.status(409).json({ error: 'Event full' }); }
  const r = db.prepare('INSERT INTO event_registrations (event_id, volunteer_id) VALUES (?,?)').run(req.params.id, req.user.id);
  res.status(201).json({ id: r.lastInsertRowid, status: 'registered' });
});

app.delete('/api/events/:id/register', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM event_registrations WHERE event_id=? AND volunteer_id=?').run(req.params.id, req.user.id);
  res.json({ message: 'Unregistered' });
});

app.put('/api/events/:id/attendance', authenticateToken, requireAdmin, (req, res) => {
  const { volunteerId, status, hours } = req.body;
  db.prepare('UPDATE event_registrations SET status=?, hours_logged=COALESCE(?,hours_logged) WHERE event_id=? AND volunteer_id=?').run(status, hours, req.params.id, volunteerId);
  res.json({ message: 'Attendance updated' });
});

app.get('/api/my-events', authenticateToken, (req, res) => {
  const regs = db.prepare('SELECT er.*, e.title, e.type, e.event_date, e.location, e.city, e.status as event_status FROM event_registrations er JOIN events e ON er.event_id=e.id WHERE er.volunteer_id=? ORDER BY e.event_date DESC').all(req.user.id);
  const totalHours = regs.reduce((sum, r) => sum + (r.hours_logged || 0), 0);
  res.json({ events: regs, totalRegistered: regs.length, totalAttended: regs.filter(r => r.status === 'attended').length, totalHours });
});

// ==================== BRANCHES ====================

app.get('/api/branches', authenticateToken, (req, res) => {
  const branches = db.prepare('SELECT * FROM branches').all();
  const enriched = branches.map(b => ({ ...b, volunteerCount: db.prepare('SELECT COUNT(*) as c FROM volunteers WHERE city=?').get(b.city).c }));
  res.json(enriched);
});
app.get('/api/branches/:id', authenticateToken, (req, res) => { const b = db.prepare('SELECT * FROM branches WHERE id=?').get(req.params.id); b ? res.json(b) : res.status(404).json({ error: { message: 'Not found' } }); });
app.post('/api/branches', authenticateToken, requireAdmin, (req, res) => { const { name, city, state, contactEmail, contactPhone } = req.body; const r = db.prepare('INSERT INTO branches (name,city,state,contact_email,contact_phone) VALUES (?,?,?,?,?)').run(name, city, state, contactEmail, contactPhone); res.status(201).json(db.prepare('SELECT * FROM branches WHERE id=?').get(r.lastInsertRowid)); });
app.put('/api/branches/:id', authenticateToken, requireAdmin, (req, res) => { const { name, city, state, contactEmail, contactPhone, status } = req.body; db.prepare('UPDATE branches SET name=COALESCE(?,name),city=COALESCE(?,city),state=COALESCE(?,state),contact_email=COALESCE(?,contact_email),contact_phone=COALESCE(?,contact_phone),status=COALESCE(?,status) WHERE id=?').run(name, city, state, contactEmail, contactPhone, status, req.params.id); res.json(db.prepare('SELECT * FROM branches WHERE id=?').get(req.params.id)); });
app.delete('/api/branches/:id', authenticateToken, requireAdmin, (req, res) => { db.prepare('DELETE FROM branches WHERE id=?').run(req.params.id); res.json({ message: 'Deleted' }); });

// ==================== STUDENTS ====================

app.get('/api/students', authenticateToken, requireAdmin, (req, res) => { const { city, branchId, volunteerId, status } = req.query; let q = 'SELECT * FROM students WHERE 1=1'; const p = []; if (city) { q += ' AND city=?'; p.push(city); } if (branchId) { q += ' AND branch_id=?'; p.push(branchId); } if (volunteerId) { q += ' AND assigned_volunteer_id=?'; p.push(volunteerId); } if (status) { q += ' AND status=?'; p.push(status); } res.json(db.prepare(q).all(...p)); });
app.get('/api/students/summary', authenticateToken, requireAdmin, (req, res) => { res.json({ totalStudents: db.prepare('SELECT COUNT(*) as c FROM students').get().c, activeStudents: db.prepare("SELECT COUNT(*) as c FROM students WHERE status='active'").get().c, totalSessions: db.prepare('SELECT COUNT(*) as c FROM teaching_sessions').get().c, totalTeachingMinutes: db.prepare('SELECT COALESCE(SUM(duration_minutes),0) as c FROM teaching_sessions').get().c }); });
app.get('/api/students/:id', authenticateToken, (req, res) => { const s = db.prepare('SELECT * FROM students WHERE id=?').get(req.params.id); if (!s) return res.status(404).json({ error: { message: 'Not found' } }); const sessions = db.prepare('SELECT * FROM teaching_sessions WHERE student_id=? ORDER BY session_date DESC').all(req.params.id); res.json({ student: s, sessions }); });
app.post('/api/students', authenticateToken, requireAdmin, (req, res) => { const { name, age, school, grade, guardianName, guardianPhone, city, branchId, assignedVolunteerId } = req.body; const r = db.prepare('INSERT INTO students (name,age,school,grade,guardian_name,guardian_phone,city,branch_id,assigned_volunteer_id) VALUES (?,?,?,?,?,?,?,?,?)').run(name, age, school, grade, guardianName, guardianPhone, city, branchId, assignedVolunteerId); res.status(201).json(db.prepare('SELECT * FROM students WHERE id=?').get(r.lastInsertRowid)); });
app.put('/api/students/:id', authenticateToken, requireAdmin, (req, res) => { const { name, age, school, grade, guardianName, guardianPhone, city, branchId, assignedVolunteerId, status, notes } = req.body; db.prepare('UPDATE students SET name=COALESCE(?,name),age=COALESCE(?,age),school=COALESCE(?,school),grade=COALESCE(?,grade),guardian_name=COALESCE(?,guardian_name),guardian_phone=COALESCE(?,guardian_phone),city=COALESCE(?,city),branch_id=COALESCE(?,branch_id),assigned_volunteer_id=COALESCE(?,assigned_volunteer_id),status=COALESCE(?,status),notes=COALESCE(?,notes) WHERE id=?').run(name, age, school, grade, guardianName, guardianPhone, city, branchId, assignedVolunteerId, status, notes, req.params.id); res.json(db.prepare('SELECT * FROM students WHERE id=?').get(req.params.id)); });
app.delete('/api/students/:id', authenticateToken, requireAdmin, (req, res) => { db.prepare('DELETE FROM students WHERE id=?').run(req.params.id); res.json({ message: 'Deleted' }); });

app.post('/api/students/sessions', authenticateToken, (req, res) => { const { studentId, subject, sessionDate, durationMinutes, notes } = req.body; if (!studentId || !subject) return res.status(400).json({ error: { message: 'studentId and subject required' } }); const r = db.prepare('INSERT INTO teaching_sessions (volunteer_id,student_id,subject,session_date,duration_minutes,notes) VALUES (?,?,?,?,?,?)').run(req.user.id, studentId, subject, sessionDate || new Date().toISOString(), durationMinutes || 60, notes); res.status(201).json(db.prepare('SELECT * FROM teaching_sessions WHERE id=?').get(r.lastInsertRowid)); });
app.get('/api/my-sessions', authenticateToken, (req, res) => { const sessions = db.prepare('SELECT ts.*, s.name as student_name FROM teaching_sessions ts JOIN students s ON ts.student_id=s.id WHERE ts.volunteer_id=? ORDER BY ts.session_date DESC').all(req.user.id); const totalMin = sessions.reduce((sum, s) => sum + s.duration_minutes, 0); res.json({ sessions, totalSessions: sessions.length, totalMinutes: totalMin, totalHours: Math.round(totalMin / 6) / 10 }); });

// ==================== DONATIONS ====================

app.get('/api/donations', authenticateToken, requireAdmin, (req, res) => { res.json(db.prepare('SELECT * FROM donations ORDER BY donation_date DESC').all()); });
app.get('/api/donations/summary', authenticateToken, requireAdmin, (req, res) => {
  const all = db.prepare("SELECT * FROM donations WHERE status='completed'").all();
  const totalAmount = all.reduce((s, d) => s + d.amount, 0);
  const thisMonth = all.filter(d => new Date(d.donation_date) > new Date(Date.now() - 30 * 86400000)).reduce((s, d) => s + d.amount, 0);
  const byCampaign = {};
  all.forEach(d => { if (d.campaign) byCampaign[d.campaign] = (byCampaign[d.campaign] || 0) + d.amount; });
  res.json({ totalAmount, totalDonations: all.length, thisMonthAmount: thisMonth, byCampaign: Object.entries(byCampaign).map(([campaign, amount]) => ({ campaign, amount })) });
});
app.get('/api/donations/:id', authenticateToken, requireAdmin, (req, res) => { const d = db.prepare('SELECT * FROM donations WHERE id=?').get(req.params.id); d ? res.json(d) : res.status(404).json({ error: { message: 'Not found' } }); });
app.post('/api/donations', authenticateToken, requireAdmin, (req, res) => { const { donorName, donorEmail, donorPhone, amount, campaign, paymentMethod, panNumber, notes } = req.body; if (!donorName || !amount) return res.status(400).json({ error: { message: 'donorName and amount required' } }); const receipt = 'NP-' + Date.now().toString().slice(-5); const r = db.prepare('INSERT INTO donations (donor_name,donor_email,donor_phone,amount,campaign,payment_method,receipt_number,pan_number,notes) VALUES (?,?,?,?,?,?,?,?,?)').run(donorName, donorEmail, donorPhone, amount, campaign, paymentMethod, receipt, panNumber, notes); res.status(201).json(db.prepare('SELECT * FROM donations WHERE id=?').get(r.lastInsertRowid)); });
app.put('/api/donations/:id', authenticateToken, requireAdmin, (req, res) => { const { donorName, donorEmail, donorPhone, amount, campaign, paymentMethod, panNumber, status, notes } = req.body; db.prepare('UPDATE donations SET donor_name=COALESCE(?,donor_name),donor_email=COALESCE(?,donor_email),donor_phone=COALESCE(?,donor_phone),amount=COALESCE(?,amount),campaign=COALESCE(?,campaign),payment_method=COALESCE(?,payment_method),pan_number=COALESCE(?,pan_number),status=COALESCE(?,status),notes=COALESCE(?,notes) WHERE id=?').run(donorName, donorEmail, donorPhone, amount, campaign, paymentMethod, panNumber, status, notes, req.params.id); res.json(db.prepare('SELECT * FROM donations WHERE id=?').get(req.params.id)); });
app.delete('/api/donations/:id', authenticateToken, requireAdmin, (req, res) => { db.prepare('DELETE FROM donations WHERE id=?').run(req.params.id); res.json({ message: 'Deleted' }); });

// ==================== AUDIT ====================

app.get('/api/audit', authenticateToken, requireAdmin, (req, res) => { res.json(db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50').all()); });
app.post('/api/audit', authenticateToken, requireAdmin, (req, res) => { const { action, targetEntity, targetId, details } = req.body; const r = db.prepare('INSERT INTO audit_logs (admin_id,action,target_entity,target_id,details) VALUES (?,?,?,?,?)').run(req.user.id, action, targetEntity, targetId, details); res.status(201).json(db.prepare('SELECT * FROM audit_logs WHERE id=?').get(r.lastInsertRowid)); });

// ==================== CHATBOT ====================

function computeScore(userQ, faqQ) {
  const normalize = (t) => t.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
  const a = new Set(normalize(userQ)), b = new Set(normalize(faqQ));
  if (!a.size || !b.size) return 0;
  const inter = [...a].filter(x => b.has(x)).length;
  return (2.0 * inter) / (a.size + b.size) * 0.6 + (inter / Math.min(a.size, b.size)) * 0.4;
}

app.get('/api/faqs', (req, res) => { res.json(db.prepare('SELECT * FROM faqs').all()); });
app.post('/api/faqs', authenticateToken, requireAdmin, (req, res) => { const { question, answer, category } = req.body; const r = db.prepare('INSERT INTO faqs (question,answer,category) VALUES (?,?,?)').run(question, answer, category); res.status(201).json(db.prepare('SELECT * FROM faqs WHERE id=?').get(r.lastInsertRowid)); });
app.put('/api/faqs/:id', authenticateToken, requireAdmin, (req, res) => { const { question, answer, category } = req.body; db.prepare('UPDATE faqs SET question=COALESCE(?,question),answer=COALESCE(?,answer),category=COALESCE(?,category) WHERE id=?').run(question, answer, category, req.params.id); res.json(db.prepare('SELECT * FROM faqs WHERE id=?').get(req.params.id)); });
app.delete('/api/faqs/:id', authenticateToken, requireAdmin, (req, res) => { db.prepare('DELETE FROM faqs WHERE id=?').run(req.params.id); res.json({ message: 'Deleted' }); });

app.post('/api/chatbot/ask', chatbotLimiter, (req, res) => {
  const { question } = req.body;
  if (!question || !question.trim()) return res.status(400).json({ error: { message: 'Question required' } });
  const faqs = db.prepare('SELECT * FROM faqs').all();
  let bestScore = 0, bestFaq = null;
  for (const faq of faqs) { const score = computeScore(question, faq.question); if (score > bestScore) { bestScore = score; bestFaq = faq; } }

  let answer, source, matchedFaqId = null;
  if (bestScore >= 0.4 && bestFaq) { answer = bestFaq.answer; source = 'faq'; matchedFaqId = bestFaq.id; }
  else { answer = "Thank you for asking! I couldn't find a specific FAQ match. Please contact us at contact@nayepankh.org or +91 8318500748 for detailed help."; source = 'ai'; }

  // Log
  const volId = (() => { try { const t = req.headers['authorization']?.split(' ')[1]; if (t) return jwt.verify(t, JWT_SECRET).id; } catch {} return null; })();
  db.prepare('INSERT INTO chat_logs (volunteer_id,question,matched_faq_id,response_source) VALUES (?,?,?,?)').run(volId, question, matchedFaqId, source);
  res.json({ answer, source, matchedFaqId });
});

// ==================== START ====================

seed(); // Seed data on first run

app.listen(PORT, () => {
  console.log(`🚀 NayePankh API running on port ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
});

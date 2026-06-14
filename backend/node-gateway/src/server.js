const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set!');
  process.exit(1);
}
const JAVA_SERVICE_URL = process.env.JAVA_SERVICE_URL || 'http://localhost:8080/internal';
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// CORS: restrict to frontend origin in production
const ALLOWED_ORIGIN = process.env.FRONTEND_URL || '*';
app.use(cors({ origin: ALLOWED_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10kb' })); // Payload size limit
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// --- RATE LIMITERS ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 login/signup attempts per IP per window
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many attempts, please try again later' } },
  standardHeaders: true,
  legacyHeaders: false
});

const chatbotLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 chatbot requests per minute per IP
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please slow down' } }
});

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100, // 100 requests per minute for general endpoints
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Rate limit exceeded' } }
});

app.use('/api/', generalLimiter);

// --- HEALTH CHECK ---
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'api-gateway',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// JWT Verification Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Access token required' } });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Invalid or expired token' } });
    }
    req.user = user;
    next();
  });
};

// Admin Authorization Middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
  }
  next();
};

// --- AUTHENTICATION ROUTES ---

// POST /api/auth/signup - Public (rate limited)
app.post('/api/auth/signup', authLimiter, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone').optional({ checkFalsy: true }).isMobilePhone().withMessage('Invalid phone number'),
  body('age').optional({ checkFalsy: true }).isInt({ min: 5, max: 120 }).withMessage('Age must be between 5 and 120'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: errors.array()[0].msg } });
    }

    const { name, email, password, phone, age, city, skills, availability, role } = req.body;

    const passwordHash = bcrypt.hashSync(password, 10);
    
    // Call Java Service to create volunteer
    const response = await fetch(`${JAVA_SERVICE_URL}/volunteers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        passwordHash,
        phone,
        age: age ? parseInt(age) : null,
        city,
        skills,
        availability,
        role: role || 'volunteer'
      })
    });

    const data = await response.json();
    
    if (response.status === 409) {
      return res.status(409).json({ error: { code: 'EMAIL_EXISTS', message: 'Email is already registered' } });
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: { code: 'SERVER_ERROR', message: data.error || 'Failed to create account' } });
    }

    res.status(201).json({ message: 'Account created successfully', id: data.id });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// POST /api/auth/login - Public (rate limited)
app.post('/api/auth/login', authLimiter, [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: errors.array()[0].msg } });
    }

    const { email, password } = req.body;

    // Call Java Service to get volunteer by email
    const response = await fetch(`${JAVA_SERVICE_URL}/volunteers/by-email?email=${encodeURIComponent(email)}`);
    if (response.status === 404) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    }

    const user = await response.json();
    
    // Verify password hash
    const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// --- VOLUNTEER PROFILE ROUTES (JWT PROTECTED) ---

// POST /api/auth/forgot-password - Request password reset
app.post('/api/auth/forgot-password', authLimiter, [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: errors.array()[0].msg } });
    }
    const { email } = req.body;
    
    // Check if user exists
    const response = await fetch(`${JAVA_SERVICE_URL}/volunteers/by-email?email=${encodeURIComponent(email)}`);
    if (response.status === 404) {
      // Don't reveal if email exists - always return success
      return res.status(200).json({ message: 'If the email is registered, a reset link has been sent.' });
    }
    
    const user = await response.json();
    
    // Generate a time-limited reset token (JWT with short expiry)
    const resetToken = jwt.sign(
      { id: user.id, email: user.email, purpose: 'password_reset' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // In production: send email with reset link containing the token
    // For now: log the token (would be replaced with email service)
    console.log(`[PASSWORD RESET] Token for ${email}: ${resetToken}`);
    
    res.status(200).json({ 
      message: 'If the email is registered, a reset link has been sent.',
      // Include token in dev mode for testing (remove in production)
      ...(process.env.NODE_ENV !== 'production' && { resetToken })
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// POST /api/auth/reset-password - Reset password with token
app.post('/api/auth/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: errors.array()[0].msg } });
    }
    
    const { token, newPassword } = req.body;
    
    // Verify the reset token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.purpose !== 'password_reset') {
        return res.status(400).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid reset token' } });
      }
    } catch (e) {
      return res.status(400).json({ error: { code: 'INVALID_TOKEN', message: 'Reset token is invalid or expired' } });
    }
    
    // Hash new password
    const passwordHash = bcrypt.hashSync(newPassword, 10);
    
    // Update via Java service
    const response = await fetch(`${JAVA_SERVICE_URL}/volunteers/${decoded.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passwordHash })
    });
    
    if (!response.ok) {
      return res.status(500).json({ error: { code: 'UPDATE_FAILED', message: 'Failed to update password' } });
    }
    
    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// --- VOLUNTEER PROFILE ROUTES (JWT PROTECTED) ---

// GET /api/volunteers/me - Get own profile
app.get('/api/volunteers/me', authenticateToken, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/volunteers/${req.user.id}`);
    if (!response.ok) {
      return res.status(response.status).json({ error: { code: 'NOT_FOUND', message: 'Profile not found' } });
    }
    const user = await response.json();
    delete user.passwordHash; // Don't expose hash
    res.status(200).json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// PUT /api/volunteers/me - Update own profile
app.put('/api/volunteers/me', authenticateToken, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/volunteers/${req.user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: { code: 'UPDATE_FAILED', message: data.error || 'Failed to update profile' } });
    }
    delete data.passwordHash;
    res.status(200).json(data);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// --- ADMIN VOLUNTEER CRUD ROUTES (ADMIN ONLY) ---

// GET /api/volunteers - Get all volunteers (proxied with pagination)
app.get('/api/volunteers', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const query = new URLSearchParams(req.query).toString();
    const response = await fetch(`${JAVA_SERVICE_URL}/volunteers?${query}`);
    const data = await response.json();
    
    // Remove password hashes from response
    if (Array.isArray(data)) {
      const cleanData = data.map(v => {
        delete v.passwordHash;
        return v;
      });
      res.status(response.status).json(cleanData);
    } else if (data.results && Array.isArray(data.results)) {
      // Paginated response
      data.results = data.results.map(v => {
        delete v.passwordHash;
        return v;
      });
      res.status(response.status).json(data);
    } else {
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('Admin get volunteers error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// GET /api/volunteers/:id - Get detail (proxied)
app.get('/api/volunteers/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/volunteers/${req.params.id}`);
    const data = await response.json();
    delete data.passwordHash;
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Admin get detail error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// DELETE /api/volunteers/:id - Delete record (proxied)
app.delete('/api/volunteers/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/volunteers/${req.params.id}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Admin delete error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// PUT /api/volunteers/:id/status - Update volunteer status (Admin only)
app.put('/api/volunteers/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/volunteers/${req.params.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...req.body, approvedBy: req.user.id })
    });
    const data = await response.json();
    if (data.passwordHash) delete data.passwordHash;
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Admin status update error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// --- ANALYTICS ROUTES (ADMIN ONLY) ---

// --- EVENT ROUTES ---

// --- BRANCH ROUTES (ADMIN ONLY) ---

// GET /api/branches - Get all branches
app.get('/api/branches', authenticateToken, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/branches`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// GET /api/branches/:id - Get branch detail
app.get('/api/branches/:id', authenticateToken, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/branches/${req.params.id}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Get branch error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// POST /api/branches - Create branch (Admin)
app.post('/api/branches', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/branches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Create branch error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// PUT /api/branches/:id - Update branch (Admin)
app.put('/api/branches/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/branches/${req.params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Update branch error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// DELETE /api/branches/:id - Delete branch (Admin)
app.delete('/api/branches/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/branches/${req.params.id}`, { method: 'DELETE' });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Delete branch error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// --- EVENT ROUTES ---

// GET /api/events - Get all events (authenticated)
app.get('/api/events', authenticateToken, async (req, res) => {
  try {
    const query = new URLSearchParams(req.query).toString();
    const response = await fetch(`${JAVA_SERVICE_URL}/events?${query}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// GET /api/events/:id - Get event detail
app.get('/api/events/:id', authenticateToken, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/events/${req.params.id}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Get event detail error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// POST /api/events - Create event (Admin only)
app.post('/api/events', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...req.body, createdBy: req.user.id })
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// PUT /api/events/:id - Update event (Admin only)
app.put('/api/events/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/events/${req.params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// DELETE /api/events/:id - Delete event (Admin only)
app.delete('/api/events/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/events/${req.params.id}`, { method: 'DELETE' });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// POST /api/events/:id/register - Register for event (Volunteer)
app.post('/api/events/:id/register', authenticateToken, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/events/${req.params.id}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volunteerId: req.user.id })
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Register event error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// DELETE /api/events/:id/register - Unregister from event (Volunteer)
app.delete('/api/events/:id/register', authenticateToken, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/events/${req.params.id}/register/${req.user.id}`, { method: 'DELETE' });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Unregister event error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// PUT /api/events/:id/attendance - Mark attendance (Admin only)
app.put('/api/events/:id/attendance', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/events/${req.params.id}/attendance`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// GET /api/events/my-events - Get volunteer's registered events
app.get('/api/my-events', authenticateToken, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/events/volunteer/${req.user.id}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Get my events error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// --- ANALYTICS ROUTES (ADMIN ONLY) ---

// GET /api/analytics/summary
app.get('/api/analytics/summary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/analytics/summary`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// GET /api/analytics/trends
app.get('/api/analytics/trends', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/analytics/trends`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Analytics trends error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// --- CHATBOT ROUTES (PUBLIC / ADMIN) ---

// --- AUDIT LOG ROUTES (ADMIN ONLY) ---

// --- STUDENT ROUTES ---

// --- DONATION ROUTES (ADMIN ONLY) ---

// GET /api/donations - Get all donations
app.get('/api/donations', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/donations`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Get donations error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// GET /api/donations/summary - Donation analytics
app.get('/api/donations/summary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/donations/summary`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Donation summary error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// GET /api/donations/:id - Get donation detail
app.get('/api/donations/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/donations/${req.params.id}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Get donation error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// POST /api/donations - Record donation (Admin)
app.post('/api/donations', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/donations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Create donation error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// PUT /api/donations/:id - Update donation (Admin)
app.put('/api/donations/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/donations/${req.params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Update donation error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// DELETE /api/donations/:id - Delete donation (Admin)
app.delete('/api/donations/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/donations/${req.params.id}`, { method: 'DELETE' });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Delete donation error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// --- STUDENT ROUTES ---

// GET /api/students - Get all students (Admin)
app.get('/api/students', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const query = new URLSearchParams(req.query).toString();
    const response = await fetch(`${JAVA_SERVICE_URL}/students?${query}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// GET /api/students/summary - Student stats
app.get('/api/students/summary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/students/summary`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Student summary error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// GET /api/students/:id - Get student detail
app.get('/api/students/:id', authenticateToken, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/students/${req.params.id}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// POST /api/students - Create student (Admin)
app.post('/api/students', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// PUT /api/students/:id - Update student (Admin)
app.put('/api/students/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/students/${req.params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// DELETE /api/students/:id - Delete student (Admin)
app.delete('/api/students/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/students/${req.params.id}`, { method: 'DELETE' });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// POST /api/students/sessions - Log teaching session
app.post('/api/students/sessions', authenticateToken, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/students/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...req.body, volunteerId: req.body.volunteerId || req.user.id })
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Log session error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// GET /api/students/sessions/mine - Get my teaching sessions
app.get('/api/my-sessions', authenticateToken, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/students/sessions/volunteer/${req.user.id}`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Get my sessions error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  }
});

// --- AUDIT LOG ROUTES (ADMIN ONLY) ---

// POST /api/audit - Log an admin action
app.post('/api/audit', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...req.body, adminId: req.user.id })
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Audit log error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to log action' } });
  }
});

// GET /api/audit - Get recent audit logs
app.get('/api/audit', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${JAVA_SERVICE_URL}/audit`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch audit logs' } });
  }
});

// --- CHATBOT ROUTES (PUBLIC / ADMIN) ---

// POST /api/chatbot/ask - Public (rate limited)
app.post('/api/chatbot/ask', chatbotLimiter, async (req, res) => {
  try {
    // If the request contains a token, decode it and pass the volunteerId
    let volunteerId = null;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        volunteerId = decoded.id;
      } catch (e) {
        // Continue anonymous
      }
    }

    const response = await fetch(`${PYTHON_SERVICE_URL}/chatbot/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: req.body.question,
        volunteerId: volunteerId
      })
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Chatbot ask error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to contact chatbot service' } });
  }
});

// GET /api/faqs - Public
app.get('/api/faqs', async (req, res) => {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/faqs`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Get FAQs error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve FAQs' } });
  }
});

// POST /api/faqs - Admin Only
app.post('/api/faqs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/faqs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Create FAQ error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create FAQ' } });
  }
});

// PUT /api/faqs/:id - Admin Only
app.put('/api/faqs/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/faqs/${req.params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Update FAQ error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update FAQ' } });
  }
});

// DELETE /api/faqs/:id - Admin Only
app.delete('/api/faqs/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/faqs/${req.params.id}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Delete FAQ error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete FAQ' } });
  }
});

// Start Gateway Server
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`Proxying Core CRUD/Analytics to Java Service: ${JAVA_SERVICE_URL}`);
  console.log(`Proxying Chatbot/FAQs to Python Service: ${PYTHON_SERVICE_URL}`);
});

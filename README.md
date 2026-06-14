# 🌱 NayePankh Foundation — Volunteer Registration & Management System

> A production-grade, full-stack volunteer management platform built for **NayePankh Foundation** — India's biggest student-led NGO (200,000+ lives touched, 15+ branches, UP Government Registered, 80G & 12A Certified).

![Status](https://img.shields.io/badge/Status-Production--Ready-brightgreen) ![Architecture](https://img.shields.io/badge/Stack-Node.js_+_React-blue) ![Deploy](https://img.shields.io/badge/Deploy-Render_Free-orange)

---

## 🎯 What This System Does

| Module | What It Covers |
|--------|---------------|
| 🧑‍🤝‍🧑 **Volunteer Management** | Registration, approval workflow, profile management, status tracking |
| 📅 **Event & Drive Management** | Create drives, volunteer sign-up/RSVP, attendance, hours logging |
| 🏫 **Branch Operations** | Multi-city branch management with volunteer counts |
| 👨‍🎓 **Student Beneficiary Tracking** | Record students being served, teaching sessions, progress |
| 💰 **Donation Management** | Record donations, campaign tracking, receipt generation, analytics |
| 📊 **Analytics & Reports** | Signups over time, by city, skill, age + CSV/print export |
| 🤖 **AI Chatbot** | FAQ keyword matching + fallback + chat logging |
| 🔐 **Security** | JWT auth, bcrypt, rate limiting, Helmet headers, audit logs |

---

## 🏗️ Architecture (Unified)

```
┌──────────────────────────────────────────────────────────────────┐
│                   FRONTEND (React 19 + Vite)                      │
│  Landing • Login • Signup • Dashboard • Events • Admin Panel      │
└───────────────────────────────┬──────────────────────────────────┘
                                │ REST API (JSON)
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│              UNIFIED BACKEND (Node.js + Express + SQLite)          │
│                                                                    │
│  Auth (JWT + bcrypt)    │  Volunteer CRUD      │  Chatbot (FAQ)   │
│  Rate Limiting          │  Event Management    │  Audit Log       │
│  Input Validation       │  Branch Management   │  Donations       │
│  Helmet Security        │  Student Tracking    │  Analytics       │
│                                                                    │
│                    SQLite (better-sqlite3)                         │
│  volunteers • events • branches • students • donations • faqs     │
│  event_registrations • teaching_sessions • audit_logs • chat_logs │
└──────────────────────────────────────────────────────────────────┘
```

**Only 2 services to deploy:**
- `backend/node-gateway` → Node.js API (everything in one server)
- `frontend` → React static site

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js ≥ 18

### Terminal 1 — Backend
```bash
cd backend/node-gateway
npm install
npm run dev
# → API running on http://localhost:5000
# → Auto-seeds demo data on first run
```

### Terminal 2 — Frontend
```bash
cd frontend
npm install
npm run dev
# → Open http://localhost:5173
```

That's it. Two commands. No Java, no Python, no external database needed.

---

## 🌐 Deploy on Render (Free Tier)

### Option A: Blueprint (One-Click)
1. Go to **https://dashboard.render.com** → **New** → **Blueprint**
2. Connect repo: **Mat-rixMJ/NGO-VRS**
3. Render auto-detects `render.yaml` → Click **Apply**
4. After deploy, set `VITE_API_BASE_URL` on frontend to your API URL + `/api`

### Option B: Manual (2 Services)

**Backend (Web Service):**
| Setting | Value |
|---------|-------|
| Root Directory | `backend/node-gateway` |
| Build Command | `npm install` |
| Start Command | `node src/server.js` |
| Plan | Free |
| Env: `JWT_SECRET` | Any 32+ char random string |
| Env: `NODE_ENV` | `production` |

**Frontend (Static Site):**
| Setting | Value |
|---------|-------|
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |
| Rewrite Rule | `/* → /index.html` |
| Env: `VITE_API_BASE_URL` | `https://<your-backend>.onrender.com/api` |

---

## 🔑 Demo Credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Admin** | admin@nayepankh.org | password123 | Full dashboard, all management |
| **Volunteer** | aarav@example.com | password123 | Profile, events, chatbot |

> 10 volunteers pre-seeded across Kanpur, Ghaziabad, Noida (last 2 months)

---

## 📱 Pages & User Flows

### Public
- **Landing Page** — Hero, impact stats, gallery, contact
- **AI Chatbot** — Floating widget on every page

### Volunteer (After Login)
- **Dashboard** — Profile completeness, skills, details
- **Events** — Browse drives, register/unregister, view stats (attended, hours)
- **Profile Edit** — Update name, phone, city, skills, availability

### Admin
- **Overview** — KPI cards, enrollment chart, branch leaderboard
- **Volunteers** — Paginated table, search/filter, approve/reject, status management
- **Analytics** — Signups by time/city/skill/age (interactive Recharts)
- **Events** — Create/manage drives, mark attendance, log hours
- **Students** — Beneficiary records, teaching sessions
- **Donations** — Record/view donations, campaign analytics
- **FAQs** — Manage chatbot knowledge base
- **Reports** — CSV export, print-ready HTML

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register |
| POST | `/api/auth/login` | Login → JWT |
| POST | `/api/auth/forgot-password` | Get reset token |
| POST | `/api/auth/reset-password` | Reset with token |

### Volunteers
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/volunteers/me` | User | Own profile |
| PUT | `/api/volunteers/me` | User | Update profile |
| GET | `/api/volunteers?page=&limit=&search=&city=&skill=` | Admin | Paginated list |
| GET | `/api/volunteers/:id` | Admin | Detail |
| PUT | `/api/volunteers/:id/status` | Admin | Change status |
| DELETE | `/api/volunteers/:id` | Admin | Delete |

### Events
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/events` | User | List events |
| GET | `/api/events/:id` | User | Detail + registrations |
| POST | `/api/events` | Admin | Create |
| PUT | `/api/events/:id` | Admin | Update |
| DELETE | `/api/events/:id` | Admin | Delete |
| POST | `/api/events/:id/register` | User | Join event |
| DELETE | `/api/events/:id/register` | User | Leave event |
| PUT | `/api/events/:id/attendance` | Admin | Mark attendance |
| GET | `/api/my-events` | User | My events + hours |

### Branches
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/branches` | User | List + volunteer counts |
| POST | `/api/branches` | Admin | Create |
| PUT | `/api/branches/:id` | Admin | Update |
| DELETE | `/api/branches/:id` | Admin | Delete |

### Students
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/students` | Admin | List (filter by city/branch/volunteer) |
| GET | `/api/students/summary` | Admin | Stats |
| GET | `/api/students/:id` | User | Detail + sessions |
| POST | `/api/students` | Admin | Create |
| PUT | `/api/students/:id` | Admin | Update |
| DELETE | `/api/students/:id` | Admin | Delete |
| POST | `/api/students/sessions` | User | Log teaching session |
| GET | `/api/my-sessions` | User | My teaching history |

### Donations
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/donations` | Admin | List all |
| GET | `/api/donations/summary` | Admin | Totals + by campaign |
| POST | `/api/donations` | Admin | Record |
| PUT | `/api/donations/:id` | Admin | Update |
| DELETE | `/api/donations/:id` | Admin | Delete |

### Chatbot & FAQs
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/chatbot/ask` | Public | Ask question |
| GET | `/api/faqs` | Public | List FAQs |
| POST | `/api/faqs` | Admin | Create |
| PUT | `/api/faqs/:id` | Admin | Edit |
| DELETE | `/api/faqs/:id` | Admin | Delete |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/audit` | Admin action logs |
| POST | `/api/audit` | Log admin action |

---

## 🗄️ Database (SQLite — Auto-Created)

```
volunteers          — id, name, email, password_hash, phone, age, city, skills,
                      availability, role, status, approved_at, approved_by, created_at

events              — id, title, description, type, event_date, location, city,
                      max_capacity, status, created_by, created_at

event_registrations — id, event_id, volunteer_id, status, hours_logged, registered_at

branches            — id, name, city, state, head_volunteer_id, contact_email,
                      contact_phone, status, founded_at, created_at

students            — id, name, age, school, grade, guardian_name, guardian_phone,
                      city, branch_id, assigned_volunteer_id, status, notes, created_at

teaching_sessions   — id, volunteer_id, student_id, subject, session_date,
                      duration_minutes, notes, created_at

donations           — id, donor_name, donor_email, donor_phone, amount, currency,
                      campaign, payment_method, receipt_number, pan_number,
                      status, notes, donation_date, created_at

audit_logs          — id, admin_id, action, target_entity, target_id, details, created_at

faqs                — id, question, answer, category
chat_logs           — id, volunteer_id, question, matched_faq_id, response_source, created_at
```

---

## 🔒 Security

| Layer | Implementation |
|-------|---------------|
| Passwords | bcrypt (10 salt rounds) |
| Sessions | JWT, 24h expiry |
| Validation | express-validator on all inputs |
| Rate Limiting | Auth: 20/15min, Chatbot: 30/min, General: 100/min |
| Headers | Helmet (XSS, HSTS, noSniff, frameguard) |
| Payload | 10KB body limit |
| CORS | Origin-restricted in production |
| Secrets | Never in responses |
| Access | Role-based middleware |
| Audit | All admin actions logged |

---

## 📁 Project Structure

```
NGO-VRS/
├── backend/
│   └── node-gateway/              # Unified API server
│       ├── src/
│       │   ├── server.js          # All routes + logic (single file)
│       │   ├── db.js              # SQLite schema + connection
│       │   └── seed.js            # Demo data seeder
│       ├── package.json
│       └── .env.example
│
├── frontend/                      # React 19 + Vite
│   ├── src/
│   │   ├── api/axiosClient.js     # JWT-intercepted HTTP client
│   │   ├── components/            # Navbar, ChatbotWidget, ProtectedRoute
│   │   ├── context/               # AuthContext
│   │   └── pages/                 # Landing, Login, Signup, Dashboard, Events, Admin
│   ├── package.json
│   └── vite.config.js
│
├── render.yaml                    # Render Blueprint (one-click deploy)
├── README.md
├── TEST_REPORT.md                 # 35/35 tests passed
├── PRD_Volunteer_Registration_System.md
└── TRD_Volunteer_Registration_System.md
```

---

## 📊 Seeded Demo Data

| Entity | Count | Details |
|--------|-------|---------|
| Admin | 1 | Prashant Shukla |
| Volunteers | 10 | Last 2 months, across Kanpur/Ghaziabad/Noida |
| Branches | 3 | Kanpur HQ, Ghaziabad, Noida |
| Events | 5 | 3 upcoming, 2 completed (with attendance) |
| Students | 5 | Class 4-8, multiple schools |
| Donations | 5 | ₹1,55,000 total |
| FAQs | 6 | Registration, eligibility, contact, etc. |

---

## 🙏 About NayePankh Foundation

[NayePankh Foundation](https://nayepankh.com) is a UP Government registered NGO (80G & 12A) working towards uplifting underprivileged communities across 15+ cities in India.

- 🌍 200,000+ lives touched
- 🎓 India's biggest student-led NGO
- 📰 Featured in The Pioneer, Dainik Jagran, Hindustan
- 📞 contact@nayepankh.com | +91 8318500748

---

Built with ❤️ as part of the Full Stack Development Internship at NayePankh Foundation.

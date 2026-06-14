# 🌱 NayePankh Foundation — Volunteer Registration & Management System

> A production-grade, full-stack volunteer management platform built for **NayePankh Foundation** — India's biggest student-led NGO (200,000+ lives touched, 15+ branches, UP Government Registered, 80G & 12A Certified).

![Status](https://img.shields.io/badge/Status-Production--Ready-brightgreen) ![Architecture](https://img.shields.io/badge/Architecture-Microservices-blue) ![Services](https://img.shields.io/badge/Services-4-orange)

---

## 🎯 What This System Does

This is a **complete volunteer operations platform** — not just a registration form. It manages the entire volunteer lifecycle from signup to event participation to impact tracking.

| Module | What It Covers |
|--------|---------------|
| 🧑‍🤝‍🧑 **Volunteer Management** | Registration, approval workflow, profile management, status tracking |
| 📅 **Event & Drive Management** | Create drives, volunteer sign-up/RSVP, attendance, hours logging |
| 🏫 **Branch Operations** | Multi-city branch management with coordinators and volunteer counts |
| 👨‍🎓 **Student Beneficiary Tracking** | Record students being served, teaching sessions, progress |
| 💰 **Donation Management** | Record donations, campaign tracking, receipt generation, analytics |
| 📊 **Analytics & Reports** | Signups over time, by city, skill, age + CSV/print export |
| 🤖 **AI Chatbot** | FAQ matching + LLM fallback (OpenAI/Anthropic) + chat logging |
| 🔐 **Security** | JWT auth, bcrypt, rate limiting, Helmet headers, audit logs |

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19 + Vite)                     │
│  Landing • Login • Signup • Dashboard • Events • Admin Panel          │
│                         Port 5173                                      │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ REST API (JSON)
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    API GATEWAY (Node.js + Express)                     │
│  Authentication • Authorization • Validation • Rate Limiting          │
│  Helmet Security Headers • Request Routing • Audit Logging            │
│                         Port 5000                                      │
└────────────┬─────────────────────────────────────────┬───────────────┘
             │                                         │
             ▼                                         ▼
┌────────────────────────────┐          ┌──────────────────────────────┐
│  CORE SERVICE (Spring Boot) │          │  CHATBOT SERVICE (FastAPI)    │
│  Volunteer CRUD             │          │  FAQ Matching (DICE coeff.)   │
│  Event Management           │          │  LLM Fallback (GPT/Claude)   │
│  Branch Management          │          │  Chat Logging                 │
│  Student Tracking           │          │       Port 8000               │
│  Donation Tracking          │          └──────────────────────────────┘
│  Analytics Engine           │
│  Audit Log                  │
│       Port 8080             │
└────────────┬────────────────┘
             │
             ▼
┌────────────────────────────┐
│     SQLite Database         │
│  volunteers • events        │
│  branches • students        │
│  donations • audit_logs     │
│  teaching_sessions          │
│  event_registrations        │
└────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React, Vite, Recharts, Lucide Icons | React 19, Vite 8 |
| API Gateway | Node.js, Express, JWT, Helmet, express-rate-limit | Node 18+, Express 4 |
| Core Service | Java, Spring Boot, JPA/Hibernate, SQLite | Java 21, Spring Boot 3.3 |
| Chatbot | Python, FastAPI, SQLite | Python 3.9+ |
| Database | SQLite (file-based, auto-created) | — |

---

## 🚀 Quick Start (4 terminals)

### Prerequisites
- Node.js ≥ 18 • Java 21+ (JDK) • Python 3.9+ • Maven 3.x

### Terminal 1 — Java Core Service
```bash
cd backend/java-core
mvn spring-boot:run
# → Running on port 8080. Auto-seeds 1 admin + 12 volunteers.
```

### Terminal 2 — Python Chatbot
```bash
cd backend/python-chatbot
pip install -r requirements.txt
python main.py
# → Running on port 8000. Auto-seeds 6 FAQs.
```

### Terminal 3 — Node.js Gateway
```bash
cd backend/node-gateway
cp .env.example .env   # Edit: set JWT_SECRET to any 32+ char string
npm install
npm run dev
# → Running on port 5000.
```

### Terminal 4 — React Frontend
```bash
cd frontend
npm install
npm run dev
# → Open http://localhost:5173
```

---

## 🔑 Demo Credentials

| Role | Email | Password | What You Can Do |
|------|-------|----------|-----------------|
| **Admin** | admin@nayepankh.org | password123 | Full dashboard, manage volunteers/events/students/donations |
| **Volunteer** | asha@example.com | password123 | View profile, browse events, register for drives |

> 12 volunteers are pre-seeded across Mumbai, Pune, Bangalore, Delhi, and Noida.

---

## 📱 Pages & User Flows

### Public (No Login)
- **Landing Page** — Hero section, impact stats, gallery, footer with contact
- **AI Chatbot** — Floating widget accessible from every page

### Volunteer (After Login)
- **Dashboard** — Profile completeness tracker, skills, volunteer details
- **Events** — Browse drives, register/unregister, view personal stats (attended, hours)
- **Profile Edit** — Update name, phone, city, skills, availability

### Admin (After Admin Login)
- **Overview** — KPI cards, enrollment chart, branch leaderboard, recent registrations
- **Volunteers** — Paginated table with search/filter, status management, view/delete
- **Analytics** — Signups over time, by city, by skill, by age band (interactive charts)
- **Events** — Create/manage drives and events
- **FAQs** — Add/edit/delete chatbot knowledge base
- **Reports** — CSV export, print-ready HTML report with all data

---

## 🔌 Complete API Reference

### Auth & Password
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | Public | Register volunteer |
| POST | `/api/auth/login` | Public | Get JWT token |
| POST | `/api/auth/forgot-password` | Public | Request reset token |
| POST | `/api/auth/reset-password` | Public | Reset with token |

### Volunteer Profile
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/volunteers/me` | User | Own profile |
| PUT | `/api/volunteers/me` | User | Update profile |

### Admin — Volunteer Management
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/volunteers?page=&limit=&search=&city=&skill=` | Admin | Paginated list |
| GET | `/api/volunteers/:id` | Admin | Detail view |
| PUT | `/api/volunteers/:id/status` | Admin | Change status (pending/approved/active/inactive) |
| DELETE | `/api/volunteers/:id` | Admin | Delete record |

### Events & Drives
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/events` | User | List all events |
| GET | `/api/events/:id` | User | Event + registrations |
| POST | `/api/events` | Admin | Create event |
| PUT | `/api/events/:id` | Admin | Update event |
| DELETE | `/api/events/:id` | Admin | Delete event |
| POST | `/api/events/:id/register` | User | Join an event |
| DELETE | `/api/events/:id/register` | User | Leave an event |
| PUT | `/api/events/:id/attendance` | Admin | Mark attendance + hours |
| GET | `/api/my-events` | User | Personal event history + stats |

### Branches
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/branches` | User | All branches + volunteer counts |
| GET | `/api/branches/:id` | User | Branch detail |
| POST | `/api/branches` | Admin | Create branch |
| PUT | `/api/branches/:id` | Admin | Update branch |
| DELETE | `/api/branches/:id` | Admin | Delete branch |

### Students (Beneficiaries)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/students?city=&branchId=&volunteerId=&status=` | Admin | List with filters |
| GET | `/api/students/summary` | Admin | Total students, sessions, teaching hours |
| GET | `/api/students/:id` | User | Student + teaching history |
| POST | `/api/students` | Admin | Register student |
| PUT | `/api/students/:id` | Admin | Update student |
| DELETE | `/api/students/:id` | Admin | Remove student |
| POST | `/api/students/sessions` | User | Log a teaching session |
| GET | `/api/my-sessions` | User | Volunteer's teaching history |

### Donations
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/donations` | Admin | All donations |
| GET | `/api/donations/summary` | Admin | Total, this month, by campaign |
| GET | `/api/donations/:id` | Admin | Donation detail |
| POST | `/api/donations` | Admin | Record donation |
| PUT | `/api/donations/:id` | Admin | Update donation |
| DELETE | `/api/donations/:id` | Admin | Delete donation |

### Analytics & Chatbot
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/analytics/summary` | Admin | Volunteer totals |
| GET | `/api/analytics/trends` | Admin | Charts data |
| GET | `/api/faqs` | Public | List FAQs |
| POST | `/api/faqs` | Admin | Create FAQ |
| PUT | `/api/faqs/:id` | Admin | Edit FAQ |
| DELETE | `/api/faqs/:id` | Admin | Delete FAQ |
| POST | `/api/chatbot/ask` | Public | Ask chatbot |

### System
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | Public | Gateway health |
| GET | `/api/audit` | Admin | Recent admin actions |
| POST | `/api/audit` | Admin | Log action |

---

## 🗄️ Database Schema

```
volunteers         — id, name, email, passwordHash, phone, age, city, skills,
                     availability, role, status, approvedAt, approvedBy, createdAt

events             — id, title, description, type, eventDate, location, city,
                     maxCapacity, status, createdBy, createdAt

event_registrations — id, eventId, volunteerId, status, registeredAt, hoursLogged

branches           — id, name, city, state, headVolunteerId, contactEmail,
                     contactPhone, status, foundedAt, createdAt

students           — id, name, age, school, grade, guardianName, guardianPhone,
                     city, branchId, assignedVolunteerId, status, notes, createdAt

teaching_sessions  — id, volunteerId, studentId, subject, sessionDate,
                     durationMinutes, notes, createdAt

donations          — id, donorName, donorEmail, donorPhone, amount, currency,
                     campaign, paymentMethod, receiptNumber, panNumber,
                     status, notes, donationDate, createdAt

audit_logs         — id, adminId, action, targetEntity, targetId, details, createdAt

faqs               — id, question, answer, category
chat_logs          — id, volunteerId, question, matchedFaqId, responseSource, createdAt
```

---

## 🔒 Security Implementation

| Layer | Protection |
|-------|-----------|
| Passwords | bcrypt hash (10 salt rounds) |
| Sessions | JWT with 24h expiry |
| Validation | express-validator on all inputs |
| Rate Limiting | Auth: 20/15min, Chatbot: 30/min, General: 100/min |
| Headers | Helmet (XSS, HSTS, noSniff, frameguard) |
| Payload | 10KB body size limit |
| CORS | Origin-restricted in production |
| Secrets | Never exposed in API responses |
| Access Control | Role-based middleware (volunteer/admin) |
| Accountability | Audit log for all admin actions |
| Password Reset | 1-hour expiry tokens |

---

## 🤖 AI Chatbot — How It Works

```
User Question
     │
     ▼
┌─────────────────────┐
│ Normalize + Tokenize │
└──────────┬──────────┘
           ▼
┌─────────────────────┐     Score ≥ 0.4?     ┌─────────────┐
│ DICE Coefficient vs  │ ──── YES ──────────▶ │ Return FAQ  │
│ all stored FAQs      │                      │ answer      │
└──────────┬──────────┘                      └─────────────┘
           │ NO
           ▼
┌─────────────────────┐     API Key exists?   ┌─────────────┐
│ LLM Fallback        │ ──── YES ──────────▶ │ GPT/Claude  │
│ (FAQ as context)    │                      │ response    │
└──────────┬──────────┘                      └─────────────┘
           │ NO
           ▼
┌─────────────────────┐
│ Keyword Fallback +   │
│ Contact Info         │
└─────────────────────┘
```

All interactions are logged to `chat_logs` for analytics.

---

## 📁 Project Structure

```
nayrpankh/
├── frontend/                          # React 19 + Vite
│   └── src/
│       ├── api/axiosClient.js         # JWT-intercepted HTTP client
│       ├── components/                # Navbar, ChatbotWidget, ProtectedRoute
│       ├── context/                   # AuthContext (global auth state)
│       └── pages/                     # Landing, Login, Signup, Dashboard, Events, Admin
│
├── backend/
│   ├── node-gateway/                  # Express API Gateway
│   │   └── src/server.js             # All routes, auth, validation, rate limiting
│   │
│   ├── java-core/                     # Spring Boot 3.3 Core Service
│   │   └── src/main/java/.../
│   │       ├── controller/            # Volunteer, Event, Branch, Student, Donation, Audit
│   │       ├── model/                 # JPA entities (7 tables)
│   │       ├── repository/            # Spring Data JPA interfaces
│   │       └── config/                # Database seeder
│   │
│   └── python-chatbot/                # FastAPI Chatbot Service
│       └── main.py                    # FAQ matching, LLM fallback, chat logging
│
├── volunteer_system.db                # SQLite DB (auto-created by Java)
├── chatbot_faqs.db                    # Chatbot DB (auto-created by Python)
├── PRD_Volunteer_Registration_System.md
├── TRD_Volunteer_Registration_System.md
└── README.md
```

---

## 🌐 Deployment Guide

| Service | Platform | Notes |
|---------|----------|-------|
| Frontend | Vercel / Netlify | Set `VITE_API_BASE_URL` |
| Gateway | Render / Railway | Set all env vars below |
| Java | Render (Docker) | Needs persistent volume for SQLite |
| Python | Render / Railway | Lightweight, auto-scales |

**Environment Variables:**
```env
JWT_SECRET=your_strong_random_string_min_32_chars
FRONTEND_URL=https://your-frontend.vercel.app
JAVA_SERVICE_URL=http://java-service:8080/internal
PYTHON_SERVICE_URL=http://python-service:8000
OPENAI_API_KEY=sk-...        # Optional: for AI chatbot
ANTHROPIC_API_KEY=sk-ant-... # Optional: alternative AI
```

---

## 📊 Key Metrics This System Tracks

| Metric | Source |
|--------|--------|
| Total registered volunteers | `/api/analytics/summary` |
| New this week / month | `/api/analytics/summary` |
| Volunteers by city, skill, age | `/api/analytics/trends` |
| Events conducted | `/api/events` |
| Volunteer hours logged | `/api/my-events` |
| Students being taught | `/api/students/summary` |
| Teaching hours delivered | `/api/my-sessions` |
| Total donations received | `/api/donations/summary` |
| Donations by campaign | `/api/donations/summary` |
| Branch performance | `/api/branches` |

---

## 🙏 About NayePankh Foundation

[NayePankh Foundation](https://nayepankh.com) is a UP Government registered NGO (80G & 12A certified) working towards uplifting underprivileged communities. Operating across 15+ cities in India, it is one of the largest student-led organizations providing education, food, healthcare, and sanitary supplies to those in need.

- 🌍 200,000+ lives touched
- 🎓 Student-led operations
- 📰 Featured in The Pioneer, Dainik Jagran, Hindustan
- 📞 contact@nayepankh.com | +91 8318500748

---

Built with ❤️ as part of the Full Stack Development Internship at NayePankh Foundation.

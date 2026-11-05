# Milestone 2: AI-Based Intelligent Examination Platform

Comprehensive examination platform featuring automated AI proctoring, generative question synthesis, and multi-portal academic workflows.

---

## 📁 Project Architecture

```
milestone2/
├── backend/          # FastAPI REST API & AI Proctoring Engine
│   ├── database.py   # SQLite database schema and connection layer
│   ├── main.py       # FastAPI application entrypoint
│   ├── routers/      # API endpoints (auth, tests, ai, proctoring, submissions)
│   ├── services/     # Gemini AI generative services
│   └── requirements.txt
│
└── frontend/         # React + Vite Interactive Client Application
    ├── src/
    │   ├── components/  # Student, Teacher, and Proctoring components
    │   ├── pages/       # Portal views (Student, Teacher, Admin, Login, Signup)
    │   ├── styles/      # Modern responsive styling
    │   └── utils/       # API clients and validation helpers
    ├── package.json
    └── vite.config.js
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup (FastAPI)
```bash
# Navigate to backend directory
cd milestone2/backend

# Create & activate virtual environment (optional)
python -m venv .venv
# Windows:
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start backend server (runs on http://localhost:8000)
uvicorn main:app --reload --port 8000
```
Interactive Swagger Documentation: `http://localhost:8000/docs`

---

### 2. Frontend Setup (React + Vite)
```bash
# Open a new terminal and navigate to frontend
cd milestone2/frontend

# Install packages
npm install

# Start Vite dev server (runs on http://localhost:3000)
npm run dev
```

---

## 🌟 Key Capabilities
- **Teacher Portal**: Assessment authoring wizard, custom question bank, AI question generation via Gemini, candidate enrollment, and automated exam scheduling.
- **Student Portal**: Live active examinations, instant AI practice test runner, automated proctoring (webcam gaze tracking, tab-switch lock), and scorecards.
- **Multi-Role Authentication**: Dynamic faculty and student access controls with real educator identity attribution.


# ExamAI — Backend REST API (Milestone 2)

Enterprise-grade online examination platform backend powered by **FastAPI**, **SQLite**, and **Google Gemini AI**.

---

## 📁 Architecture Overview

```text
milestone2/
├── db/
│   └── examai.db                # SQLite database (Users, Tests, Submissions, Proctoring)
└── backend/
    ├── main.py                  # FastAPI server entry point & CORS configuration
    ├── database.py              # SQLite connection, schema definition & auto-seeding
    ├── requirements.txt         # Python dependencies
    ├── services/
    │   └── gemini_service.py    # Google Gemini AI question generator & answer evaluation
    └── routers/
        ├── auth.py              # Student/Teacher signup, login & roster queries
        ├── tests.py             # Assessment creation, scheduling, assignment & codes
        ├── ai.py                # AI Question synthesis & written response grading
        ├── submissions.py       # Exam submissions, scoring & student history
        └── proctoring.py        # Tab switch & webcam suspicion event telemetry
```

---

## 🚀 How to Run the Backend

### Step 1: Activate Virtual Environment
Open your terminal in the project root:
```bash
# Windows
.venv\Scripts\activate
```

### Step 2: Start the FastAPI Server
Navigate to `milestone2/backend` and run:
```bash
cd milestone2/backend
uvicorn main:app --reload --port 8000
```
*Or directly:*
```bash
python main.py
```

---

## 🌐 Interactive Swagger Documentation

Once started, open your browser:
- **Interactive Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Check**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)


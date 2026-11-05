"""
ExamAI Backend Application (Milestone 2)
FastAPI REST Server with Automated Proctoring, AI Question Generation & Audit Registry
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import find_dotenv, load_dotenv

# Load root .env
load_dotenv(find_dotenv(usecwd=True) or None, override=True)

# Import Database & Routers
from database import init_db
from routers.auth import router as auth_router
from routers.tests import router as tests_router
from routers.ai import router as ai_router
from routers.submissions import router as submissions_router
from routers.proctoring import router as proctoring_router

# Initialize DB tables & seed data
init_db()

app = FastAPI(
    title="ExamAI — Intelligent Examination Platform API",
    description="Enterprise-grade online examination platform with Gemini AI question generation, automated MediaPipe proctoring & evaluation audit registry.",
    version="2.0.0",
)

# Configure CORS for Vite React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth_router)
app.include_router(tests_router)
app.include_router(ai_router)
app.include_router(submissions_router)
app.include_router(proctoring_router)


@app.get("/")
def root():
    return {
        "platform": "ExamAI Intelligent Examination Platform",
        "version": "2.0.0",
        "status": "online",
        "docs": "/docs",
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "aiService": bool(os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")),
        "database": "connected (milestone2/db/examai.db)",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)


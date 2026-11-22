# ExamAI - AI-Powered Intelligent Examination Platform

An end-to-end, modern examination platform designed for universities, schools, and enterprise hiring. ExamAI combines **real-time browser-based AI proctoring**, **generative question synthesis**, and **automated multimodal evaluation** into a clean, unified system.

---

## 🚀 Overview

Traditional online examinations struggle with academic dishonesty, manual question authoring overhead, and slow grading. **ExamAI** solves these problems with:
- **Zero-Install Edge AI Proctoring:** Real-time gaze tracking and anti-cheating monitoring running directly in the candidate's browser with zero video streaming to servers.
- **Generative Assessment Engine:** Instant, syllabus-aligned test creation powered by Gemini & OpenAI LLMs.
- **Multimodal Evaluation:** Automated grading for Multiple Choice Questions (MCQs), descriptive written answers, and handwritten solution sheets via OCR.
- **Dual Role Workflows:** Dedicated portals for **Educators** (authoring, scheduling, audit registries) and **Students** (fullscreen exam runner, practice suites, instant scorecards).

---

## ✨ Features

### 🛡️ Smart AI Proctoring Suite
- **Gaze Tracking & Face Pose:** Uses 468 3D facial landmarks to detect when a student diverts their gaze outside the screen.
- **Face Absence & Multiple Faces:** Instantly flags if the candidate leaves the webcam view or if an unauthorized person enters the frame.
- **Full-Screen Lock & Tab Monitoring:** Tracks window focus and tab switching with strike warnings and automatic submission limits.
- **Evidence Snapshots:** Automatically captures timestamped photo evidence during infractions for educator review.
- **Privacy-First (Client-Side Edge Computing):** Computer vision runs locally on the candidate's browser via WebRTC and Canvas — raw webcam video is never sent over the network.

### 📝 Assessment Generation & Authoring
- **AI-Powered Question Synthesis:** Automatically generate MCQs, multi-select, and descriptive questions with custom difficulty levels (Easy, Medium, Hard).
- **Custom Question Wizard:** Teachers can manually write questions, attach marking schemes, and set time limits.
- **Batch Assignment & Scheduling:** Assign tests to specific students or classes with custom access windows and codes.

### ✍️ Intelligent Evaluation
- **Instant Objective Evaluation:** Automated 100% accurate scoring for MCQs and multi-select questions.
- **Semantic Rubric Evaluation:** NLP-based conceptual grading for subjective and descriptive answers against model answers.
- **Handwritten Sheet OCR:** Students can snap a photo of their handwritten paper answers; AI transcribes and grades them against the marking rubric.

### 📊 Results & Live Audit Registry
- **Student Scorecards:** Detailed visual score breakdowns (objective vs. subjective), percentage ratings, and instant explanations.
- **Educator Audit Console:** Live suspicion index (Clean vs. Suspicious), violation timelines, and photographic proof audits.

---

## 🏗️ Project Architecture

```
ExamAI/
│
├── frontend/                       # React 18 + Vite Modern Client
│   ├── src/
│   │   ├── components/
│   │   │   ├── student/            # Fullscreen Exam Runner, Practice Suite, Results
│   │   │   └── teacher/            # Assessment Wizard, Submissions & Proctoring Audits
│   │   ├── pages/                  # Student & Educator Portals, Auth Pages
│   │   ├── styles/                 # Theme variables & responsive layouts
│   │   └── utils/                  # Vision helpers, API clients, storage failovers
│   ├── package.json
│   └── vite.config.js
│
├── backend/                        # FastAPI RESTful Microservice
│   ├── main.py                     # API Application Entrypoint
│   ├── database.py                 # SQLite ORM & Data Models
│   ├── routers/                    # Endpoints for Auth, Tests, Proctoring & Submissions
│   ├── services/                   # Generative AI services (Gemini & OpenAI)
│   └── requirements.txt
│
└── README.md
```

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, Modern CSS3, HTML5 Canvas API, WebRTC
- **Backend:** Python 3.11, FastAPI, Pydantic, Uvicorn, REST API
- **Computer Vision & ML:** Google MediaPipe FaceMesh (468 3D landmarks), Edge ML
- **Generative AI:** Google Gemini 1.5 Flash / Pro (Vision), OpenAI GPT-4o
- **Database & Storage:** SQLite3, SQLAlchemy ORM, Multi-Tier Client Persistence

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+** & npm
- **Google Gemini API Key** (or OpenAI API Key)

---

### 2. Backend Setup

```bash
# Navigate to backend folder
cd milestone2/backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn main:app --reload --port 8000
```
- API Docs: `http://localhost:8000/docs`

---

### 3. Frontend Setup

```bash
# Open a new terminal and navigate to frontend
cd milestone2/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
- Web Application: `http://localhost:3000`

---

## 🛡️ Proctoring Security Matrix

| Incident Type | Trigger Condition | Severity | System Action |
| :--- | :--- | :--- | :--- |
| **Gaze Deviation** | Gaze directed outside the screen boundary | Medium | Live warning notification & log |
| **Looking Away** | Head orientation rotated away from webcam | Medium | Timestamped incident entry |
| **Window Blur** | Browser tab switched or window minimized | High | Strike warning recorded |
| **Fullscreen Exit** | Exiting dedicated fullscreen exam mode | High | Strike counter & modal alert |
| **Face Absent** | Candidate moves out of camera sight | High | Photo evidence captured |
| **Multiple Faces** | More than one person detected in frame | Critical | High-risk incident logged |

---

## 👨‍💻 Author

Developed by **Anupam Kumar**  
GitHub: [@Anupam477](https://github.com/Anupam477)

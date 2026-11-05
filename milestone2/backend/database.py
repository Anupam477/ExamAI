"""
ExamAI Database Layer (Milestone 2 Backend)
SQLite storage located at milestone2/db/examai.db
"""

import json
import os
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional

# Locate DB file in milestone2/db/examai.db
BASE_DIR = Path(__file__).resolve().parent.parent
DB_DIR = BASE_DIR / "db"
DB_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DB_DIR / "examai.db"


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL,
        identifier TEXT,
        department TEXT,
        college TEXT,
        sub_details TEXT,
        class_year TEXT,
        status TEXT DEFAULT 'approved',
        active INTEGER DEFAULT 1,
        rejection_reason TEXT,
        admin_notes TEXT,
        avatar_color TEXT,
        created_at TEXT
    );
    """)

    # 2. Tests Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tests (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        subject TEXT,
        topic TEXT,
        instructor TEXT,
        instructor_role TEXT,
        description TEXT,
        instructions TEXT,
        difficulty TEXT DEFAULT 'Medium',
        duration INTEGER DEFAULT 30,
        max_tab_switches INTEGER DEFAULT 3,
        scheduled_start TEXT,
        scheduled_end TEXT,
        proctoring_json TEXT,
        questions_json TEXT,
        assigned_students_json TEXT,
        code TEXT UNIQUE,
        status TEXT DEFAULT 'draft',
        created_at TEXT,
        updated_at TEXT
    );
    """)

    # 3. Submissions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        test_id TEXT NOT NULL,
        test_code TEXT,
        test_title TEXT,
        subject TEXT,
        topic TEXT,
        difficulty TEXT,
        student_id TEXT NOT NULL,
        student_name TEXT,
        student_email TEXT,
        score REAL DEFAULT 0,
        total_marks REAL DEFAULT 0,
        percentage REAL DEFAULT 0,
        status TEXT DEFAULT 'NEEDS_REVIEW',
        correct_count INTEGER DEFAULT 0,
        wrong_count INTEGER DEFAULT 0,
        skipped_count INTEGER DEFAULT 0,
        total_questions INTEGER DEFAULT 0,
        time_taken_display TEXT,
        questions_json TEXT,
        review_json TEXT,
        submitted_at TEXT
    );
    """)

    # 4. Proctoring Logs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS proctoring_logs (
        id TEXT PRIMARY KEY,
        test_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        details_json TEXT,
        severity TEXT DEFAULT 'warning',
        timestamp TEXT
    );
    """)

    conn.commit()
    seed_initial_data(conn)
    conn.close()


def seed_initial_data(conn: sqlite3.Connection):
    cursor = conn.cursor()

    # Seed initial users if table is empty
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        initial_users = [
            (
                "usr_001",
                "Dummy Student",
                "dummystudent@gmail.com",
                "student",
                "36FFHFHGF",
                "Computer Science",
                "Apex Institute of Technology",
                "12th Standard · Science",
                "1 Year",
                "approved",
                1,
                "#2D5BD0",
                "2026-10-22",
            ),
            (
                "usr_002",
                "Test Student",
                "teststudent@gmail.com",
                "student",
                "24HG-8812",
                "Mathematics",
                "Metro State University",
                "12th Standard · Section B",
                "2 Year",
                "approved",
                1,
                "#2563EB",
                "2026-10-22",
            ),
            (
                "usr_003",
                "Dr. Test Teacher",
                "teacher@gmail.com",
                "teacher",
                "FAC-MATHS-401",
                "Mathematics",
                "National Polytechnic College",
                "Senior Lecturer · Mathematics",
                None,
                "approved",
                1,
                "#0E6B58",
                "2026-10-22",
            ),
            (
                "usr_004",
                "Dev Student",
                "student@gmail.com",
                "student",
                "24-CS-092",
                "Computer Science",
                "Delhi Institute of Engineering",
                "B.Tech · 2nd Year",
                "2 Year",
                "approved",
                1,
                "#3B82F6",
                "2026-10-22",
            ),
        ]
        cursor.executemany(
            """
            INSERT OR IGNORE INTO users (
                id, name, email, role, identifier, department, college,
                sub_details, class_year, status, active, avatar_color, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
            initial_users,
        )

    # Seed initial assessments if table is empty
    cursor.execute("SELECT COUNT(*) FROM tests")
    if cursor.fetchone()[0] == 0:
        sample_q1 = [
            {
                "id": "q_001",
                "type": "mcq",
                "marks": 5,
                "title": "In deep convolutional neural networks (CNNs), what is the primary role of a pooling layer (such as Max-Pooling)?",
                "options": [
                    "Reduces spatial dimensions (width x height) to limit computational load and prevent overfitting",
                    "Flattens all weight matrices into one-dimensional scalar probability tensors",
                    "Computes the backward chain-rule gradient vector for the output layer",
                    "Normalizes pixel luminance uniformly across all incoming RGB color channels",
                ],
                "correctOption": 0,
                "explanation": "Pooling downsamples spatial dimensions while preserving dominant feature maps.",
            },
            {
                "id": "q_002",
                "type": "mcq",
                "marks": 5,
                "title": "Which loss function is standard when optimizing a multi-class neural network with a Softmax output layer?",
                "options": [
                    "Categorical Cross-Entropy Loss",
                    "Mean Squared Error (MSE)",
                    "Huber Smooth L1 Loss",
                    "Hinge Loss",
                ],
                "correctOption": 0,
                "explanation": "Categorical cross-entropy directly measures divergence between target distribution and Softmax probabilities.",
            },
        ]

        cursor.execute(
            """
            INSERT OR IGNORE INTO tests (
                id, title, subject, topic, instructor, instructor_role,
                description, instructions, difficulty, duration, max_tab_switches,
                scheduled_start, scheduled_end, proctoring_json, questions_json,
                assigned_students_json, code, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
            (
                "test_001",
                "Artificial Intelligence & Machine Learning",
                "Computer Science",
                "Deep Learning & Neural Networks",
                "Dr. Test Teacher",
                "Senior Lecturer · Mathematics & AI",
                "Comprehensive midterm evaluation on deep neural network architectures.",
                "Webcam proctoring is active throughout the session. Closed-book examination.",
                "Medium",
                45,
                3,
                "2026-10-26T09:00",
                "2026-10-30T21:00",
                json.dumps({
                    "webcam": True,
                    "negativeMarking": False,
                    "shuffleQuestions": True,
                    "shuffleOptions": True,
                }),
                json.dumps(sample_q1),
                json.dumps(["usr_001", "usr_002", "usr_004"]),
                "AIML-DEEP-2026",
                "published",
                "2026-10-25",
                "2026-10-25",
            ),
        )

    conn.commit()


# Initialize database automatically on module import
init_db()


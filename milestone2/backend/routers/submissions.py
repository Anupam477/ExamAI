"""
Submissions & Examination Results Router (Milestone 2 Backend)
"""

import json
import time
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_db_connection

router = APIRouter(prefix="/api/submissions", tags=["Submissions"])


class SubmissionPayload(BaseModel):
    id: Optional[str] = None
    testId: str
    testCode: Optional[str] = None
    testTitle: str
    subject: Optional[str] = "General"
    topic: Optional[str] = "Assessment"
    difficulty: Optional[str] = "Medium"
    studentId: str
    studentName: Optional[str] = "Student"
    studentEmail: Optional[str] = None
    score: float = 0
    totalMarks: float = 100
    percentage: float = 0
    status: Optional[str] = "PASSED"
    correctCount: int = 0
    wrongCount: int = 0
    skippedCount: int = 0
    totalQuestions: int = 0
    timeTakenDisplay: Optional[str] = "30 mins"
    questions: Optional[List[Dict[str, Any]]] = None
    review: Optional[List[Dict[str, Any]]] = None


@router.post("")
def save_submission(payload: SubmissionPayload):
    conn = get_db_connection()
    cursor = conn.cursor()

    sub_id = payload.id or f"sub_{int(time.time() * 1000)}"
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ")

    cursor.execute(
        """
        INSERT OR REPLACE INTO submissions (
            id, test_id, test_code, test_title, subject, topic, difficulty,
            student_id, student_name, student_email, score, total_marks,
            percentage, status, correct_count, wrong_count, skipped_count,
            total_questions, time_taken_display, questions_json, review_json,
            submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """,
        (
            sub_id,
            payload.testId,
            payload.testCode,
            payload.testTitle,
            payload.subject,
            payload.topic,
            payload.difficulty,
            payload.studentId,
            payload.studentName,
            payload.studentEmail,
            payload.score,
            payload.totalMarks,
            payload.percentage,
            payload.status or "PASSED",
            payload.correctCount,
            payload.wrongCount,
            payload.skippedCount,
            payload.totalQuestions,
            payload.timeTakenDisplay,
            json.dumps(payload.questions or []),
            json.dumps(payload.review or []),
            now_iso,
        ),
    )

    conn.commit()
    conn.close()

    return {
        "success": True,
        "message": "Submission recorded successfully in institutional audit registry.",
        "submissionId": sub_id,
    }


@router.get("/student/{student_id}")
def get_student_submissions(student_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT * FROM submissions
        WHERE student_id = ? OR LOWER(student_email) = LOWER(?)
        ORDER BY submitted_at DESC
    """,
        (student_id, student_id),
    )
    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        d = dict(r)
        results.append({
            "id": d["id"],
            "testId": d["test_id"],
            "testCode": d["test_code"],
            "testTitle": d["test_title"],
            "title": d["test_title"],
            "subject": d["subject"],
            "topic": d["topic"],
            "difficulty": d["difficulty"],
            "studentId": d["student_id"],
            "studentName": d["student_name"],
            "studentEmail": d["student_email"],
            "score": d["score"],
            "totalMarks": d["total_marks"],
            "percentage": d["percentage"],
            "status": d["status"],
            "correctCount": d["correct_count"],
            "wrongCount": d["wrong_count"],
            "skippedCount": d["skipped_count"],
            "totalQuestions": d["total_questions"],
            "timeTakenDisplay": d["time_taken_display"],
            "questions": json.loads(d["questions_json"]) if d["questions_json"] else [],
            "review": json.loads(d["review_json"]) if d["review_json"] else [],
            "submittedAt": d["submitted_at"],
        })
    return results


@router.get("/test/{test_id}")
def get_test_submissions(test_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM submissions WHERE test_id = ? ORDER BY submitted_at DESC", (test_id,))
    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        d = dict(r)
        results.append({
            "id": d["id"],
            "testId": d["test_id"],
            "studentId": d["student_id"],
            "studentName": d["student_name"],
            "score": d["score"],
            "percentage": d["percentage"],
            "status": d["status"],
            "submittedAt": d["submitted_at"],
        })
    return results


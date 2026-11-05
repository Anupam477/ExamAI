"""
Tests & Examination Management Router (Milestone 2 Backend)
Handles assessment authoring, scheduling, student assignment, and examination lookup
"""

import json
import time
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from database import get_db_connection

router = APIRouter(prefix="/api/tests", tags=["Examinations"])


class TestPayload(BaseModel):
    id: Optional[str] = None
    title: str
    subject: Optional[str] = "General"
    topic: Optional[str] = "Assessment"
    instructor: Optional[str] = "Dr. Test Teacher"
    instructorRole: Optional[str] = "Senior Lecturer"
    description: Optional[str] = ""
    instructions: Optional[str] = ""
    difficulty: Optional[str] = "Medium"
    duration: Optional[int] = 30
    maxTabSwitches: Optional[int] = 3
    scheduledStart: Optional[str] = None
    scheduledEnd: Optional[str] = None
    proctoring: Optional[Dict[str, Any]] = None
    questions: Optional[List[Dict[str, Any]]] = None
    assignedStudents: Optional[List[str]] = None
    code: Optional[str] = None
    status: Optional[str] = "draft"


class ReschedulePayload(BaseModel):
    scheduledStart: str
    scheduledEnd: str


def format_test_row(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": row["id"],
        "title": row["title"],
        "subject": row["subject"],
        "topic": row["topic"],
        "instructor": row["instructor"],
        "instructorRole": row["instructor_role"],
        "description": row["description"],
        "instructions": row["instructions"],
        "difficulty": row["difficulty"],
        "duration": row["duration"],
        "maxTabSwitches": row["max_tab_switches"],
        "scheduledStart": row["scheduled_start"],
        "scheduledEnd": row["scheduled_end"],
        "proctoring": json.loads(row["proctoring_json"]) if row["proctoring_json"] else {},
        "questions": json.loads(row["questions_json"]) if row["questions_json"] else [],
        "assignedStudents": json.loads(row["assigned_students_json"]) if row["assigned_students_json"] else [],
        "code": row["code"],
        "status": row["status"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


@router.get("")
def list_tests(student_id: Optional[str] = None, student_email: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tests WHERE status != 'archived' ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()

    all_tests = [format_test_row(dict(r)) for r in rows]

    # If queried by a student, strictly filter by assigned roster
    if student_id or student_email:
        sid = (student_id or "").strip().lower()
        semail = (student_email or "").strip().lower()

        assigned_tests = []
        for t in all_tests:
            assigned_roster = [str(a).strip().lower() for a in t["assignedStudents"] if a and a != "*"]
            if (sid and sid in assigned_roster) or (semail and semail in assigned_roster):
                assigned_tests.append(t)
        return assigned_tests

    return all_tests


@router.get("/code/{code}")
def get_test_by_code(code: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tests WHERE UPPER(code) = UPPER(?)", (code.strip(),))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Invalid exam code.")
    return format_test_row(dict(row))


@router.get("/{test_id}")
def get_test_by_id(test_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tests WHERE id = ?", (test_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Test not found.")
    return format_test_row(dict(row))


@router.post("")
def create_or_update_test(payload: TestPayload):
    conn = get_db_connection()
    cursor = conn.cursor()

    test_id = payload.id or f"test_{int(time.time() * 1000)}"
    code = payload.code or f"{(payload.subject or 'EXAM')[:4].upper()}-{int(time.time()) % 9000 + 1000}"
    now_str = time.strftime("%Y-%m-%d")

    cursor.execute("SELECT id FROM tests WHERE id = ?", (test_id,))
    existing = cursor.fetchone()

    proctoring_str = json.dumps(payload.proctoring or {})
    questions_str = json.dumps(payload.questions or [])
    # Strip any wildcards from assigned students
    assigned_clean = [a for a in (payload.assignedStudents or []) if a and a != "*"]
    assigned_str = json.dumps(assigned_clean)

    if existing:
        cursor.execute(
            """
            UPDATE tests SET
                title = ?, subject = ?, topic = ?, instructor = ?, instructor_role = ?,
                description = ?, instructions = ?, difficulty = ?, duration = ?, max_tab_switches = ?,
                scheduled_start = ?, scheduled_end = ?, proctoring_json = ?, questions_json = ?,
                assigned_students_json = ?, code = ?, status = ?, updated_at = ?
            WHERE id = ?
        """,
            (
                payload.title,
                payload.subject,
                payload.topic,
                payload.instructor,
                payload.instructorRole,
                payload.description,
                payload.instructions,
                payload.difficulty,
                payload.duration,
                payload.maxTabSwitches,
                payload.scheduledStart,
                payload.scheduledEnd,
                proctoring_str,
                questions_str,
                assigned_str,
                code,
                payload.status or "draft",
                now_str,
                test_id,
            ),
        )
    else:
        cursor.execute(
            """
            INSERT INTO tests (
                id, title, subject, topic, instructor, instructor_role,
                description, instructions, difficulty, duration, max_tab_switches,
                scheduled_start, scheduled_end, proctoring_json, questions_json,
                assigned_students_json, code, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
            (
                test_id,
                payload.title,
                payload.subject,
                payload.topic,
                payload.instructor,
                payload.instructorRole,
                payload.description,
                payload.instructions,
                payload.difficulty,
                payload.duration,
                payload.maxTabSwitches,
                payload.scheduledStart,
                payload.scheduledEnd,
                proctoring_str,
                questions_str,
                assigned_str,
                code,
                payload.status or "draft",
                now_str,
                now_str,
            ),
        )

    conn.commit()
    conn.close()

    return {
        "success": True,
        "message": f"Assessment '{payload.title}' saved successfully.",
        "testId": test_id,
        "code": code,
        "status": payload.status or "draft",
    }


@router.delete("/{test_id}")
def delete_test(test_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tests WHERE id = ?", (test_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Test deleted successfully."}


@router.put("/{test_id}/reschedule")
def reschedule_test(test_id: str, payload: ReschedulePayload):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        UPDATE tests SET scheduled_start = ?, scheduled_end = ?, updated_at = ?
        WHERE id = ?
    """,
        (payload.scheduledStart, payload.scheduledEnd, time.strftime("%Y-%m-%d"), test_id),
    )
    conn.commit()
    conn.close()
    return {"success": True, "message": "Examination dates rescheduled successfully."}


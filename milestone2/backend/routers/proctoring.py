"""
Proctoring & Suspicion Logging Router (Milestone 2 Backend)
"""

import json
import time
from typing import Any, Dict, Optional
from fastapi import APIRouter
from pydantic import BaseModel
from database import get_db_connection

router = APIRouter(prefix="/api/proctoring", tags=["Automated Proctoring"])


class ProctoringEvent(BaseModel):
    testId: str
    studentId: str
    eventType: str  # 'TAB_SWITCH', 'MULTIPLE_FACES', 'FACE_LOST', 'VOICE_DETECTED'
    details: Optional[Dict[str, Any]] = None
    severity: Optional[str] = "warning"  # 'info', 'warning', 'critical'


@router.post("/log")
def log_event(event: ProctoringEvent):
    conn = get_db_connection()
    cursor = conn.cursor()

    log_id = f"proc_{int(time.time() * 1000)}"
    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ")

    cursor.execute(
        """
        INSERT INTO proctoring_logs (
            id, test_id, student_id, event_type, details_json, severity, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    """,
        (
            log_id,
            event.testId,
            event.studentId,
            event.eventType,
            json.dumps(event.details or {}),
            event.severity or "warning",
            now_iso,
        ),
    )

    conn.commit()
    conn.close()

    return {"success": True, "logId": log_id, "timestamp": now_iso}


@router.get("/test/{test_id}")
def get_test_proctoring_logs(test_id: str, student_id: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()

    if student_id:
        cursor.execute(
            """
            SELECT * FROM proctoring_logs
            WHERE test_id = ? AND student_id = ?
            ORDER BY timestamp DESC
        """,
            (test_id, student_id),
        )
    else:
        cursor.execute(
            """
            SELECT * FROM proctoring_logs
            WHERE test_id = ?
            ORDER BY timestamp DESC
        """,
            (test_id,),
        )

    rows = cursor.fetchall()
    conn.close()

    logs = []
    for r in rows:
        d = dict(r)
        logs.append({
            "id": d["id"],
            "testId": d["test_id"],
            "studentId": d["student_id"],
            "eventType": d["event_type"],
            "details": json.loads(d["details_json"]) if d["details_json"] else {},
            "severity": d["severity"],
            "timestamp": d["timestamp"],
        })
    return logs


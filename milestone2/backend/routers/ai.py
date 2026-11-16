"""
AI Question Synthesis & Evaluation Router (Milestone 2 Backend)
"""

from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel
from services.gemini_service import generate_questions, evaluate_written_answer, extract_text_from_image

router = APIRouter(prefix="/api/ai", tags=["AI Generation & Evaluation"])


class QuestionGenRequest(BaseModel):
    subject: str = "Computer Science"
    topic: str = "Data Structures & Algorithms"
    count: int = 3
    difficulty: str = "Medium"
    questionType: str = "mcq"
    focus: Optional[str] = "All"


class EvaluationRequest(BaseModel):
    question: str
    studentAnswer: str
    rubric: Optional[str] = ""
    maxMarks: Optional[float] = 10.0


class OCRRequest(BaseModel):
    image: str
    mimeType: Optional[str] = "image/jpeg"
    questionTitle: Optional[str] = ""


@router.post("/generate-questions")
def api_generate_questions(req: QuestionGenRequest):
    questions = generate_questions(
        subject=req.subject,
        topic=req.topic,
        count=req.count,
        difficulty=req.difficulty,
        question_type=req.questionType,
        focus=req.focus or "All",
    )
    return {
        "success": True,
        "count": len(questions),
        "questions": questions,
    }


@router.post("/evaluate-answer")
def api_evaluate_answer(req: EvaluationRequest):
    result = evaluate_written_answer(
        question=req.question,
        student_answer=req.studentAnswer,
        rubric=req.rubric or "",
        max_marks=req.maxMarks or 10.0,
    )
    return {
        "success": True,
        "evaluation": result,
    }


@router.post("/ocr")
def api_extract_text(req: OCRRequest):
    result = extract_text_from_image(
        image_base64_or_data_url=req.image,
        mime_type=req.mimeType or "image/jpeg",
        question_context=req.questionTitle or "",
    )
    return result


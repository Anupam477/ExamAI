"""
AI-Based Intelligent Examination Platform
Milestone 1 - Task 4: Interactive Descriptive Q&A Examination & AI Evaluation Suite
Supports MCQs, Descriptive Q&A (Written Technical Answers), and Mixed Mode Assessments with
Multidimensional AI Semantic Grading (Accuracy, Completeness, Clarity, Application) and Correct Answer Diagnostics.
"""

import base64
import concurrent.futures
import hashlib
import io
import json
import os
import re
import time
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import streamlit as st
from dotenv import load_dotenv
from google import genai
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage

# --------------------------------------------------
# 1. Environment & Safe Page Configuration
# --------------------------------------------------

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(ROOT_DIR, ".env"), override=True)

try:
    st.set_page_config(
        page_title="AI Exam & Q&A Evaluation | Task 4",
        page_icon="🎓",
        layout="centered",
    )
except Exception:
    pass

# Load global design tokens & styling
try:
    from styles import load_styles, hero
except ImportError:
    from milestone1.styles import load_styles, hero

load_styles()

# --------------------------------------------------
# 2. Resilient State Management
# --------------------------------------------------

def init_session_state():
    """Initialize all persistent state variables with session isolation."""
    if "task4_stage" not in st.session_state:
        # Stages: "SETUP", "TAKING", "CONFIRM_SUBMIT", "EVALUATING", "EVALUATED"
        st.session_state.task4_stage = "SETUP"

    if "task4_session_id" not in st.session_state:
        st.session_state.task4_session_id = 1

    if "task4_questions" not in st.session_state:
        st.session_state.task4_questions = []

    if "task4_meta" not in st.session_state:
        st.session_state.task4_meta = {
            "topic": "",
            "difficulty": "",
            "mode": "Mixed (MCQs + Q&A Questions)",
            "exam_type": "Exam Mode",
            "time_limit_mins": 0,
            "mcq_count": 3,
            "qa_count": 2,
            "total_questions": 5,
            "total_marks": 13.0,
            "provider": "",
            "timestamp": "",
        }

    if "task4_user_answers" not in st.session_state:
        st.session_state.task4_user_answers = {}

    if "task4_user_images" not in st.session_state:
        # Stores image submissions per question index:
        # idx -> {"bytes": bytes, "mime_type": str, "name": str, "extracted_text": str, "hash": str}
        st.session_state.task4_user_images = {}

    if "task4_start_time" not in st.session_state:
        st.session_state.task4_start_time = None

    if "task4_eval_results" not in st.session_state:
        st.session_state.task4_eval_results = None


init_session_state()

# --------------------------------------------------
# 3. AI Providers with Automatic Fallback & Vision OCR
# --------------------------------------------------

def get_available_providers() -> List[str]:
    """Return available AI model providers based on .env keys."""
    providers = []
    if os.getenv("GOOGLE_API_KEY"):
        providers.append("Google (Gemini Flash)")
    if os.getenv("OPENAI_API_KEY"):
        providers.append("OpenAI (ChatGPT)")
    if not providers:
        providers.append("Google (Gemini Flash)")
    return providers


def build_llm(provider_name: str, temperature: float = 0.2, model_override: str = None):
    """Instantiate LangChain chat model for the requested provider with model override support."""
    if provider_name == "OpenAI (ChatGPT)":
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY is not configured in .env.")
        model_name = model_override or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        return ChatOpenAI(
            model=model_name,
            api_key=api_key,
            temperature=temperature,
        )

    # Google Gemini
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY is not configured in .env.")
    model_name = model_override or os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
    return ChatGoogleGenerativeAI(
        model=model_name,
        google_api_key=api_key,
        temperature=temperature,
    )


def extract_text_from_image_bytes(image_bytes: bytes, mime_type: str = "image/jpeg") -> str:
    """Extract handwritten or printed text from image using Gemini Vision models with automatic fallback."""
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return "Error: GOOGLE_API_KEY is not configured in .env for Vision OCR."

    client = genai.Client(api_key=api_key)

    # Priority order of active multimodal models (fastest first)
    candidate_models = [
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite",
        "gemini-3.8-flash",
        "gemini-flash-latest",
        "gemini-3.5-flash",
    ]

    prompt_instruction = (
        "You are an academic examination OCR transcription specialist. "
        "Carefully transcribe all handwritten and printed student response text, code, math formulas, "
        "or diagrams visible in this image accurately and completely. "
        "Preserve indentation and line breaks if the answer contains code or step-by-step points. "
        "Return ONLY the transcribed text without conversational preamble or markdown code fences."
    )

    last_error = None
    for model_name in candidate_models:
        try:
            resp = client.models.generate_content(
                model=model_name,
                contents=[
                    genai.types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    prompt_instruction,
                ],
            )
            if resp and resp.text:
                cleaned = resp.text.strip()
                if cleaned:
                    return cleaned
        except Exception as err:
            last_error = err
            continue

    return f"Transcription error: Unable to extract text ({last_error})"

# --------------------------------------------------
# 4. JSON Extraction & Strict Question Validation
# --------------------------------------------------

def extract_json(raw_text: str) -> dict:
    """Robustly extract and repair JSON from model output."""
    text = raw_text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)

    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end == -1:
        raise ValueError("Model output does not contain a valid JSON object structure.")

    json_str = text[start:end + 1]
    # Clean trailing commas
    json_str = re.sub(r",\s*([\]}])", r"\1", json_str)

    try:
        return json.loads(json_str, strict=False)
    except json.JSONDecodeError:
        pass

    # Secondary repair: escape control characters like literal newlines or tabs
    sanitized = re.sub(r"[\x00-\x1f\x7f-\x9f]", lambda m: "\\n" if m.group(0) == "\n" else " ", json_str)
    try:
        return json.loads(sanitized, strict=False)
    except json.JSONDecodeError as err:
        raise ValueError(f"Failed to parse JSON response: {err}") from err


def validate_mixed_questions(
    data: dict,
    expected_mcq_count: int,
    expected_qa_count: int,
) -> List[Dict[str, Any]]:
    """Validate structure, sanitize MCQ options (A-D) and Q&A rubric details."""
    mcq_raw = data.get("mcqs") or []
    qa_raw = data.get("qa_questions") or []

    # If the model returned a unified list under 'questions'
    if not mcq_raw and not qa_raw and isinstance(data.get("questions"), list):
        for item in data.get("questions"):
            q_type = str(item.get("type", "")).lower()
            if "mcq" in q_type or "options" in item:
                mcq_raw.append(item)
            else:
                qa_raw.append(item)

    cleaned: List[Dict[str, Any]] = []
    idx_counter = 1

    # 1. Process MCQs
    required_keys = ["A", "B", "C", "D"]
    for q in mcq_raw[:expected_mcq_count]:
        if not isinstance(q, dict):
            continue
        q_text = str(q.get("question", "")).strip()
        if not q_text:
            continue

        raw_options = q.get("options")
        options = {}
        if isinstance(raw_options, list) and len(raw_options) >= 4:
            for i, key in enumerate(required_keys):
                options[key] = str(raw_options[i]).strip()
        elif isinstance(raw_options, dict):
            for key in required_keys:
                if key in raw_options:
                    options[key] = str(raw_options[key]).strip()
                elif key.lower() in raw_options:
                    options[key] = str(raw_options[key.lower()]).strip()
                else:
                    options[key] = f"Option {key}"
        else:
            continue

        # Normalize MCQ answer
        ans = str(q.get("answer") or q.get("correct_answer") or q.get("correct") or "").strip().upper()
        match = re.search(r"\b([A-D])\b", ans)
        if match:
            ans = match.group(1)
        else:
            for k in required_keys:
                if ans.lower() == options[k].lower():
                    ans = k
                    break
        if ans not in required_keys:
            ans = "A"

        explanation = str(q.get("explanation", "")).strip()
        if not explanation:
            explanation = f"The correct answer is Option {ans}: {options[ans]}."

        hint = str(q.get("hint", "Recall key core language definitions and syntax rules.")).strip()

        cleaned.append({
            "id": idx_counter,
            "type": "mcq",
            "question": q_text,
            "options": options,
            "answer": ans,
            "max_marks": 1.0,
            "explanation": explanation,
            "hint": hint,
        })
        idx_counter += 1

    # 2. Process Q&A Questions
    for q in qa_raw[:expected_qa_count]:
        if not isinstance(q, dict):
            continue
        q_text = str(q.get("question", "")).strip()
        if not q_text:
            continue

        ref_ans = str(q.get("reference_answer", "")).strip()
        if not ref_ans:
            ref_ans = "Comprehensive model answer was not specified."

        key_concepts = q.get("key_concepts")
        if not isinstance(key_concepts, list):
            key_concepts = ["Core concept definition", "Practical implementation", "Key principles"]
        else:
            key_concepts = [str(k).strip() for k in key_concepts if str(k).strip()]

        try:
            max_marks = float(q.get("max_marks", 5.0))
        except (ValueError, TypeError):
            max_marks = 5.0

        rubric = str(q.get("rubric", "Clarity, conceptual accuracy, and completeness.")).strip()
        hint = str(q.get("hint", "Focus on fundamental mechanisms, method lifecycle, and practical examples.")).strip()
        recommended_words = str(q.get("recommended_words", "40-90 words")).strip()

        cleaned.append({
            "id": idx_counter,
            "type": "qa",
            "question": q_text,
            "reference_answer": ref_ans,
            "key_concepts": key_concepts,
            "max_marks": max_marks,
            "rubric": rubric,
            "hint": hint,
            "recommended_words": recommended_words,
        })
        idx_counter += 1

    if not cleaned:
        raise ValueError("Unable to generate valid assessment questions from the AI model.")

    return cleaned

# --------------------------------------------------
# 5. Question Generation with Fallback
# --------------------------------------------------

def generate_questions_with_fallback(
    topic: str,
    difficulty: str,
    mode: str,
    mcq_count: int,
    qa_count: int,
    primary_provider: str,
) -> Tuple[List[Dict[str, Any]], str]:
    """Generate MCQs, Q&A, or Mixed questions with automatic provider fallback."""

    system_prompt = f"""
You are an expert academic examiner and curriculum specialist designing comprehensive technical examinations.

Generate examination questions matching the requested topic and difficulty.

Assessment Format:
- Number of MCQs to generate: {mcq_count}
- Number of Q&A (Short Answer / Descriptive) questions to generate: {qa_count}

Return ONLY a valid JSON object with this exact schema:
{{
  "mcqs": [
    {{
      "question": "Clear MCQ question statement (supports markdown code blocks)",
      "options": {{
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text",
        "D": "Option D text"
      }},
      "answer": "A",
      "explanation": "Clear explanation of why this option is correct and key takeaways.",
      "hint": "Subtle conceptual clue for study mode without giving away the exact letter."
    }}
  ],
  "qa_questions": [
    {{
      "question": "In-depth conceptual or problem-solving prompt requiring a written explanation",
      "reference_answer": "Comprehensive model answer providing the ideal student response with technical depth",
      "key_concepts": [
        "Key concept 1 that must be mentioned",
        "Key concept 2 that must be explained",
        "Key concept 3 / edge case or example"
      ],
      "max_marks": 5.0,
      "rubric": "Marking breakdown (e.g., 2 marks for core definition, 1.5 marks for mechanism, 1.5 marks for edge case)",
      "hint": "Subtle conceptual reminder pointing the student toward the key mechanisms.",
      "recommended_words": "40-90 words"
    }}
  ]
}}

Rules:
- Generate EXACTLY {mcq_count} MCQs (if {mcq_count} > 0, otherwise empty list []).
- Generate EXACTLY {qa_count} Q&A questions (if {qa_count} > 0, otherwise empty list []).
- For MCQs: every question must have exactly 4 options (A, B, C, D) and answer must be strictly 'A', 'B', 'C', or 'D'.
- For Q&A: create thoughtful, non-trivial prompts suitable for university-level or professional technical exams.
- Calibrate question depth strictly to '{difficulty}' difficulty.
- Return raw JSON only, without markdown code fences or conversational text.
"""

    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessage(content=system_prompt),
            (
                "human",
                "Generate the examination now for:\n"
                "- Topic: {topic}\n"
                "- Difficulty: {difficulty}\n"
                "- MCQ Count: {mcq_count}\n"
                "- Q&A Count: {qa_count}\n\n"
                "Return the JSON now.",
            ),
        ]
    )

    all_providers = get_available_providers()
    candidates: List[Tuple[str, Optional[str]]] = []
    if primary_provider == "Google (Gemini Flash)":
        candidates.extend([
            ("Google (Gemini Flash)", "gemini-3.5-flash-lite"),
            ("Google (Gemini Flash)", "gemini-3.1-flash-lite"),
            ("Google (Gemini Flash)", "gemini-3.8-flash"),
            ("Google (Gemini Flash)", "gemini-flash-latest"),
            ("Google (Gemini Flash)", "gemini-3.5-flash"),
        ])
        if os.getenv("OPENAI_API_KEY"):
            candidates.append(("OpenAI (ChatGPT)", "gpt-4o-mini"))
    else:
        if os.getenv("OPENAI_API_KEY"):
            candidates.append(("OpenAI (ChatGPT)", "gpt-4o-mini"))
        candidates.extend([
            ("Google (Gemini Flash)", "gemini-3.5-flash-lite"),
            ("Google (Gemini Flash)", "gemini-3.1-flash-lite"),
            ("Google (Gemini Flash)", "gemini-3.8-flash"),
            ("Google (Gemini Flash)", "gemini-flash-latest"),
            ("Google (Gemini Flash)", "gemini-3.5-flash"),
        ])

    last_error = None
    for prov, model_choice in candidates:
        try:
            llm = build_llm(prov, temperature=0.2, model_override=model_choice)
            chain = prompt | llm
            response = chain.invoke({
                "topic": topic,
                "difficulty": difficulty,
                "mcq_count": mcq_count,
                "qa_count": qa_count,
            })

            content = response.content
            if isinstance(content, list):
                parts = []
                for item in content:
                    if isinstance(item, dict) and "text" in item:
                        parts.append(str(item["text"]))
                    elif hasattr(item, "text"):
                        parts.append(str(item.text))
                    else:
                        parts.append(str(item))
                content = "".join(parts)
            elif not isinstance(content, str):
                content = str(content)

            data = extract_json(content)
            qs = validate_mixed_questions(data, mcq_count, qa_count)
            return qs, f"{prov} ({model_choice})"

        except Exception as err:
            last_error = err
            continue

    raise RuntimeError(f"All AI providers failed. Last error: {last_error}")

# --------------------------------------------------
# 6. Multidimensional AI Semantic Evaluation for Q&A
# --------------------------------------------------

def evaluate_single_qa_response(
    question_text: str,
    reference_answer: str,
    key_concepts: List[str],
    max_marks: float,
    rubric: str,
    student_response: Optional[str],
    provider: str,
) -> Dict[str, Any]:
    """Grade a single written Q&A response across 4 academic dimensions with AI re-write coaching."""
    clean_student_ans = (student_response or "").strip()

    # Empty / Skipped Answer Handling
    if not clean_student_ans:
        return {
            "score": 0.0,
            "max_marks": max_marks,
            "percentage": 0.0,
            "status": "SKIPPED",
            "accuracy_tier": "Unattempted",
            "dimensions": {
                "accuracy": {"score": 0.0, "max": round(max_marks * 0.4, 1), "comment": "Unattempted."},
                "completeness": {"score": 0.0, "max": round(max_marks * 0.3, 1), "comment": "Unattempted."},
                "clarity": {"score": 0.0, "max": round(max_marks * 0.2, 1), "comment": "Unattempted."},
                "application": {"score": 0.0, "max": round(max_marks * 0.1, 1), "comment": "Unattempted."},
            },
            "concept_checklist": [
                {"concept": c, "status": "MISSED", "evidence": "Question was skipped."}
                for c in (key_concepts or ["Core Concepts"])
            ],
            "strengths": ["None (Question was skipped)."],
            "missing_concepts": key_concepts if key_concepts else ["Response was not submitted."],
            "feedback": "No answer was submitted. Review the reference model answer below to prepare for this topic.",
            "key_takeaway": "Always attempt questions by defining the core term or stating related principles.",
            "improved_student_rewrite": reference_answer,
        }

    eval_system_prompt = """
You are a premier university professor, curriculum evaluator, and technical assessment specialist.
Rigorously and fairly evaluate the student's written response across 4 core academic dimensions:
1. Technical Accuracy (40% weight): Core correctness, logic, and factual soundness.
2. Completeness & Concept Coverage (30% weight): Depth and coverage of essential keywords/mechanisms.
3. Clarity & Terminology (20% weight): Technical vocabulary, precision, and readability.
4. Practical Application & Examples (10% weight): Concrete syntax, code structure, or real-world use-cases.

Also generate:
- A concept-by-concept checklist analyzing whether each key concept was 'COVERED', 'PARTIAL', or 'MISSED'.
- An 'improved_student_rewrite': A polished version of the student's exact answer that would score 100% while retaining their natural voice and approach.

Return strictly a valid JSON object matching this schema:
{
  "total_score": 4.2,
  "max_marks": 5.0,
  "percentage": 84.0,
  "status": "FULL_MARKS",
  "accuracy_tier": "High",
  "dimensions": {
    "accuracy": {"score": 1.8, "max": 2.0, "comment": "Core definition and logic are accurate."},
    "completeness": {"score": 1.2, "max": 1.5, "comment": "Covered 2 of 3 essential principles."},
    "clarity": {"score": 0.9, "max": 1.0, "comment": "Clear structure and vocabulary."},
    "application": {"score": 0.3, "max": 0.5, "comment": "Example mentioned but not fully detailed."}
  },
  "concept_checklist": [
    {"concept": "Concept 1", "status": "COVERED", "evidence": "Student explicitly wrote X."},
    {"concept": "Concept 2", "status": "PARTIAL", "evidence": "Mentioned Y but lacked detail."},
    {"concept": "Concept 3", "status": "MISSED", "evidence": "No mention of Z."}
  ],
  "strengths": [
    "Accurately explained core principle.",
    "Used correct technical terms."
  ],
  "missing_concepts": [
    "Did not mention edge case or argument handling."
  ],
  "feedback": "Concise 1-2 sentence constructive advice on how to improve.",
  "key_takeaway": "One-sentence fundamental takeaway.",
  "improved_student_rewrite": "Rewritten model answer preserving the student's structure..."
}

Rules:
- total_score must equal the sum of dimension scores (bounded between 0.0 and max_marks).
- status must be: 'FULL_MARKS' (>=85%), 'PARTIAL_MARKS' (40-84%), or 'INSUFFICIENT' (<40%).
- accuracy_tier must be: 'High', 'Moderate', or 'Low'.
- concept status must be: 'COVERED', 'PARTIAL', or 'MISSED'.
- Return raw JSON only, without markdown fences or outside commentary.
"""

    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessage(content=eval_system_prompt),
            (
                "human",
                "Question: {question}\n"
                "Max Marks: {max_marks}\n"
                "Reference Answer: {reference_answer}\n"
                "Key Concepts: {key_concepts}\n"
                "Rubric: {rubric}\n\n"
                "Student Response:\n{student_response}\n\n"
                "Evaluate the student response now.",
            ),
        ]
    )

    candidates: List[Tuple[str, Optional[str]]] = []
    if "Google" in provider:
        candidates.extend([
            ("Google (Gemini Flash)", "gemini-3.5-flash-lite"),
            ("Google (Gemini Flash)", "gemini-3.1-flash-lite"),
            ("Google (Gemini Flash)", "gemini-3.8-flash"),
            ("Google (Gemini Flash)", "gemini-flash-latest"),
            ("Google (Gemini Flash)", "gemini-3.5-flash"),
        ])
        if os.getenv("OPENAI_API_KEY"):
            candidates.append(("OpenAI (ChatGPT)", "gpt-4o-mini"))
    else:
        if os.getenv("OPENAI_API_KEY"):
            candidates.append(("OpenAI (ChatGPT)", "gpt-4o-mini"))
        candidates.extend([
            ("Google (Gemini Flash)", "gemini-3.5-flash-lite"),
            ("Google (Gemini Flash)", "gemini-3.1-flash-lite"),
            ("Google (Gemini Flash)", "gemini-3.8-flash"),
            ("Google (Gemini Flash)", "gemini-flash-latest"),
            ("Google (Gemini Flash)", "gemini-3.5-flash"),
        ])

    for prov, model_choice in candidates:
        try:
            llm = build_llm(prov, temperature=0.1, model_override=model_choice)
            chain = prompt | llm
            res = chain.invoke({
                "question": question_text,
                "max_marks": max_marks,
                "reference_answer": reference_answer,
                "key_concepts": json.dumps(key_concepts),
                "rubric": rubric,
                "student_response": clean_student_ans,
            })

            content = res.content
            if isinstance(content, list):
                content = "".join([
                    item.get("text", "") if isinstance(item, dict) else str(item)
                    for item in content
                ])
            elif not isinstance(content, str):
                content = str(content)

            parsed = extract_json(content)
            raw_score = parsed.get("total_score")
            if raw_score is None:
                raw_score = parsed.get("score", 0.0)
            score = max(0.0, min(max_marks, float(raw_score)))
            pct = round((score / max_marks) * 100, 1) if max_marks > 0 else 0.0

            # Safe Dimensions Parsing
            dims = parsed.get("dimensions")
            if not isinstance(dims, dict) or "accuracy" not in dims:
                dims = {
                    "accuracy": {"score": round(score * 0.4, 2), "max": round(max_marks * 0.4, 1), "comment": "Evaluated based on overall accuracy."},
                    "completeness": {"score": round(score * 0.3, 2), "max": round(max_marks * 0.3, 1), "comment": "Evaluated based on conceptual coverage."},
                    "clarity": {"score": round(score * 0.2, 2), "max": round(max_marks * 0.2, 1), "comment": "Evaluated based on expression & vocabulary."},
                    "application": {"score": round(score * 0.1, 2), "max": round(max_marks * 0.1, 1), "comment": "Evaluated based on practical context."},
                }

            # Safe Checklist Parsing
            checklist = parsed.get("concept_checklist")
            if not isinstance(checklist, list):
                checklist = []
                for c in key_concepts:
                    is_hit = c.lower() in clean_student_ans.lower()
                    checklist.append({
                        "concept": c,
                        "status": "COVERED" if is_hit else "MISSED",
                        "evidence": "Matched in student response." if is_hit else "Not explicitly addressed.",
                    })

            rewrite = parsed.get("improved_student_rewrite") or reference_answer

            return {
                "score": round(score, 1),
                "max_marks": max_marks,
                "percentage": pct,
                "status": parsed.get("status", "PARTIAL_MARKS"),
                "accuracy_tier": parsed.get("accuracy_tier") or parsed.get("accuracy", "Moderate"),
                "dimensions": dims,
                "concept_checklist": checklist,
                "strengths": parsed.get("strengths") or ["Answer provided demonstrates partial understanding."],
                "missing_concepts": parsed.get("missing_concepts") or [],
                "feedback": parsed.get("feedback") or "Good attempt. Compare your answer with the reference solution.",
                "key_takeaway": parsed.get("key_takeaway") or "Review key technical principles for this topic.",
                "improved_student_rewrite": rewrite,
            }
        except Exception:
            continue

    # Heuristic fallback if LLM calls fail
    word_count = len(clean_student_ans.split())
    heuristic_score = min(max_marks, round(max_marks * (min(word_count, 45) / 45.0) * 0.7, 1))
    return {
        "score": heuristic_score,
        "max_marks": max_marks,
        "percentage": round((heuristic_score / max_marks) * 100, 1),
        "status": "PARTIAL_MARKS" if heuristic_score > 0 else "INSUFFICIENT",
        "accuracy_tier": "Moderate",
        "dimensions": {
            "accuracy": {"score": round(heuristic_score * 0.4, 1), "max": round(max_marks * 0.4, 1), "comment": "Answer registered."},
            "completeness": {"score": round(heuristic_score * 0.3, 1), "max": round(max_marks * 0.3, 1), "comment": "Key concepts examined."},
            "clarity": {"score": round(heuristic_score * 0.2, 1), "max": round(max_marks * 0.2, 1), "comment": "Written clarity assessed."},
            "application": {"score": round(heuristic_score * 0.1, 1), "max": round(max_marks * 0.1, 1), "comment": "Examples reviewed."},
        },
        "concept_checklist": [
            {"concept": c, "status": "COVERED" if c.lower() in clean_student_ans.lower() else "MISSED", "evidence": "Keyword evaluation"}
            for c in key_concepts
        ],
        "strengths": ["Submitted response recorded successfully."],
        "missing_concepts": key_concepts[:2] if key_concepts else [],
        "feedback": "Answer recorded. Review the model reference solution to verify your points.",
        "key_takeaway": "Review core subject principles.",
        "improved_student_rewrite": reference_answer,
    }

# --------------------------------------------------
# 7. Comprehensive Evaluation Engine (MCQ + Q&A)
# --------------------------------------------------

def compute_comprehensive_evaluation(progress_bar=None, status_text=None):
    """Evaluate both MCQs (instant key check) and Q&As (multidimensional AI evaluation in parallel)."""
    questions = st.session_state.task4_questions
    user_answers = st.session_state.task4_user_answers
    provider = st.session_state.task4_meta.get("provider", "Google (Gemini Flash)")

    total_questions = len(questions)

    # 1. Process MCQs instantly (0ms)
    mcq_score = 0.0
    mcq_max = 0.0
    mcq_correct = 0
    mcq_wrong = 0
    mcq_skipped = 0

    mcq_evals = {}
    for idx, q in enumerate(questions):
        if q.get("type", "mcq") == "mcq":
            mcq_max += q["max_marks"]
            user_input = user_answers.get(idx)
            correct_choice = q["answer"]

            if user_input is None:
                status = "SKIPPED"
                mcq_skipped += 1
                awarded = 0.0
            elif user_input == correct_choice:
                status = "CORRECT"
                mcq_correct += 1
                awarded = q["max_marks"]
                mcq_score += awarded
            else:
                status = "WRONG"
                mcq_wrong += 1
                awarded = 0.0

            mcq_evals[idx] = {
                "index": idx + 1,
                "type": "mcq",
                "question": q["question"],
                "options": q["options"],
                "correct_answer": correct_choice,
                "user_answer": user_input,
                "score": awarded,
                "max_marks": q["max_marks"],
                "is_correct": (status == "CORRECT"),
                "status": status,
                "explanation": q["explanation"],
                "hint": q.get("hint", ""),
            }

    # 2. Process Q&A Questions (Parallel Concurrent Execution for Maximum Speed)
    qa_indices = [i for i, q in enumerate(questions) if q.get("type") == "qa"]
    total_qa = len(qa_indices)
    qa_score = 0.0
    qa_max = 0.0
    qa_attempted = 0
    qa_skipped = 0

    qa_evals = {}
    if total_qa > 0:
        if status_text:
            status_text.write("Evaluating written answers with high-speed AI engine...")
        if progress_bar:
            progress_bar.progress(0.15)

        # Separate attempted vs unattempted
        to_evaluate = []
        for idx in qa_indices:
            q = questions[idx]
            qa_max += q["max_marks"]
            u_ans = user_answers.get(idx)
            has_ans = bool(u_ans and str(u_ans).strip())
            if has_ans:
                qa_attempted += 1
                to_evaluate.append((idx, q, str(u_ans).strip()))
            else:
                qa_skipped += 1
                # Instant evaluation without calling network LLM
                qa_evals[idx] = evaluate_single_qa_response(
                    question_text=q["question"],
                    reference_answer=q["reference_answer"],
                    key_concepts=q["key_concepts"],
                    max_marks=q["max_marks"],
                    rubric=q["rubric"],
                    student_response="",
                    provider=provider,
                )

        # Run attempted Q&As concurrently
        if to_evaluate:
            max_workers = min(len(to_evaluate), 6)
            completed_count = 0
            with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
                future_to_idx = {
                    executor.submit(
                        evaluate_single_qa_response,
                        question_text=q["question"],
                        reference_answer=q["reference_answer"],
                        key_concepts=q["key_concepts"],
                        max_marks=q["max_marks"],
                        rubric=q["rubric"],
                        student_response=u_ans,
                        provider=provider,
                    ): idx
                    for idx, q, u_ans in to_evaluate
                }
                for future in concurrent.futures.as_completed(future_to_idx):
                    idx = future_to_idx[future]
                    try:
                        qa_evals[idx] = future.result()
                    except Exception:
                        q = questions[idx]
                        qa_evals[idx] = evaluate_single_qa_response(
                            question_text=q["question"],
                            reference_answer=q["reference_answer"],
                            key_concepts=q["key_concepts"],
                            max_marks=q["max_marks"],
                            rubric=q["rubric"],
                            student_response=str(user_answers.get(idx, "")),
                            provider="fallback",
                        )
                    completed_count += 1
                    if progress_bar:
                        progress_bar.progress(0.2 + 0.8 * (completed_count / len(to_evaluate)))
                    if status_text:
                        status_text.write(f"Analyzed {completed_count}/{len(to_evaluate)} written responses...")

        if progress_bar:
            progress_bar.progress(1.0)

    # 3. Assemble results in original question order
    details = []
    for idx, q in enumerate(questions):
        if q.get("type", "mcq") == "mcq":
            details.append(mcq_evals[idx])
        else:
            eval_res = qa_evals.get(idx, {})
            qa_score += eval_res.get("score", 0.0)
            img_data = st.session_state.task4_user_images.get(idx)
            user_input = user_answers.get(idx)
            details.append({
                "index": idx + 1,
                "type": "qa",
                "question": q["question"],
                "user_answer": user_input,
                "reference_answer": q["reference_answer"],
                "key_concepts": q["key_concepts"],
                "rubric": q["rubric"],
                "hint": q.get("hint", ""),
                "score": eval_res.get("score", 0.0),
                "max_marks": eval_res.get("max_marks", q["max_marks"]),
                "percentage": eval_res.get("percentage", 0.0),
                "status": eval_res.get("status", "INSUFFICIENT"),
                "accuracy_tier": eval_res.get("accuracy_tier", "Low"),
                "dimensions": eval_res.get("dimensions", {}),
                "concept_checklist": eval_res.get("concept_checklist", []),
                "strengths": eval_res.get("strengths", []),
                "missing_concepts": eval_res.get("missing_concepts", []),
                "feedback": eval_res.get("feedback", ""),
                "key_takeaway": eval_res.get("key_takeaway", ""),
                "improved_student_rewrite": eval_res.get("improved_student_rewrite", q["reference_answer"]),
                "is_correct": (eval_res.get("score", 0.0) >= eval_res.get("max_marks", q["max_marks"]) * 0.8),
                "image_data": img_data,
                "has_image": bool(img_data),
            })

    total_score = mcq_score + qa_score
    total_max = mcq_max + qa_max
    combined_percentage = round((total_score / total_max * 100), 1) if total_max > 0 else 0.0

    mcq_percentage = round((mcq_score / mcq_max * 100), 1) if mcq_max > 0 else 0.0
    qa_percentage = round((qa_score / qa_max * 100), 1) if qa_max > 0 else 0.0

    # Elapsed time calculation
    start_time = st.session_state.get("task4_start_time")
    if start_time:
        elapsed_seconds = int(time.time() - start_time)
        m = elapsed_seconds // 60
        s = elapsed_seconds % 60
        time_str = f"{m}m {s:02d}s" if m > 0 else f"{s}s"
        pace_str = f"{round(elapsed_seconds / total_questions, 1)}s/q" if total_questions > 0 else "N/A"
    else:
        time_str = "N/A"
        pace_str = "N/A"

    # Performance Tier & Diagnostic Verdict
    if combined_percentage >= 90:
        tier_title = "Outstanding Mastery"
        verdict = "Exceptional conceptual clarity and thorough technical responses across all criteria."
        verdict_color = "var(--success)"
    elif combined_percentage >= 75:
        tier_title = "Proficient"
        verdict = "Strong competence demonstrated across objective and technical written responses."
        verdict_color = "var(--accent)"
    elif combined_percentage >= 50:
        tier_title = "Passing Standard"
        verdict = "Core concepts established. Review the feedback points to deepen accuracy."
        verdict_color = "var(--warn)"
    else:
        tier_title = "Revision Recommended"
        verdict = "Review the model answers and revised solutions below before re-attempting."
        verdict_color = "var(--danger)"

    st.session_state.task4_eval_results = {
        "total_score": round(total_score, 1),
        "total_max": round(total_max, 1),
        "combined_percentage": combined_percentage,
        "mcq_score": round(mcq_score, 1),
        "mcq_max": round(mcq_max, 1),
        "mcq_percentage": mcq_percentage,
        "mcq_correct": mcq_correct,
        "mcq_wrong": mcq_wrong,
        "mcq_skipped": mcq_skipped,
        "qa_score": round(qa_score, 1),
        "qa_max": round(qa_max, 1),
        "qa_percentage": qa_percentage,
        "qa_attempted": qa_attempted,
        "qa_skipped": qa_skipped,
        "time_taken": time_str,
        "pace": pace_str,
        "tier_title": tier_title,
        "verdict": verdict,
        "verdict_color": verdict_color,
        "details": details,
    }


def export_report_markdown() -> str:
    """Generate a comprehensive markdown diagnostic performance report."""
    eval_data = st.session_state.task4_eval_results
    meta = st.session_state.task4_meta

    if not eval_data:
        return "No evaluation data available."

    lines = [
        "# AI Examination Platform — Comprehensive Diagnostic Report",
        f"- **Date & Time:** {meta.get('timestamp')}",
        f"- **Topic / Subject:** {meta.get('topic')}",
        f"- **Difficulty Level:** {meta.get('difficulty')}",
        f"- **Assessment Mode:** {meta.get('mode')}",
        f"- **Environment:** {meta.get('exam_type')}",
        f"- **AI Engine:** {meta.get('provider')}",
        f"- **Duration:** {eval_data.get('time_taken')} (Average: {eval_data.get('pace')})",
        "",
        "## Performance Scorecard",
        f"- **Combined Score:** {eval_data['total_score']} / {eval_data['total_max']} Marks ({eval_data['combined_percentage']}%)",
        f"- **Proficiency Rating:** {eval_data['tier_title']}",
        f"- **Diagnostic Verdict:** {eval_data['verdict']}",
        "",
    ]

    if eval_data["mcq_max"] > 0:
        lines.extend([
            "### Multiple Choice (MCQ) Breakdown",
            f"- **MCQ Score:** {eval_data['mcq_score']} / {eval_data['mcq_max']} ({eval_data['mcq_percentage']}%)",
            f"- **Correct:** {eval_data['mcq_correct']} | **Incorrect:** {eval_data['mcq_wrong']} | **Skipped:** {eval_data['mcq_skipped']}",
            "",
        ])

    if eval_data["qa_max"] > 0:
        lines.extend([
            "### Q&A (Short Answer) Multidimensional AI Evaluation",
            f"- **Q&A Score:** {eval_data['qa_score']} / {eval_data['qa_max']} ({eval_data['qa_percentage']}%)",
            f"- **Questions Attempted:** {eval_data['qa_attempted']} | **Skipped:** {eval_data['qa_skipped']}",
            "",
        ])

    lines.extend([
        "---",
        "## Detailed Question-by-Question Diagnostics",
        "",
    ])

    for item in eval_data["details"]:
        q_num = item["index"]
        q_type = item["type"].upper()
        lines.append(f"### Q{q_num} [{q_type} • {item['max_marks']} Marks]")
        lines.append(f"**Question:** {item['question']}\n")

        if item["type"] == "mcq":
            lines.append(f"- **Result:** `{item['status']}` (Score: {item['score']} / {item['max_marks']})")
            lines.append(f"- **Your Choice:** {item['user_answer'] or 'None (Skipped)'}")
            lines.append(f"- **Correct Option:** {item['correct_answer']}) {item['options'].get(item['correct_answer'])}")
            lines.append(f"- **Rationale:** {item['explanation']}\n")
        else:
            lines.append(f"- **AI Score Awarded:** {item['score']} / {item['max_marks']} Marks ({item['percentage']}%)")
            lines.append(f"- **Evaluation Status:** `{item['status']}` (Accuracy: {item['accuracy_tier']})")
            if item.get("has_image") and item.get("image_data"):
                img_name = item["image_data"].get("name", "answer_image.jpg")
                lines.append(f"- **Submitted Answer Sheet Image:** Attached (`{img_name}`)")
                ocr_txt = item["image_data"].get("extracted_text", "")
                if ocr_txt:
                    lines.append(f"- **AI Vision Transcribed Text from Image:**\n> {ocr_txt}\n")
            lines.append(f"- **Final Student Answer:**\n> {item['user_answer'] or '*(No answer submitted)*'}\n")

            # Dimensions
            dims = item.get("dimensions", {})
            if dims:
                lines.append("- **Grading Criteria Breakdown:**")
                for d_name, d_val in dims.items():
                    lines.append(f"  - **{d_name.capitalize()}**: {d_val.get('score')}/{d_val.get('max')} — {d_val.get('comment')}")
                lines.append("")

            # Concept checklist
            checklist = item.get("concept_checklist", [])
            if checklist:
                lines.append("- **Concept Coverage Checklist:**")
                for chk in checklist:
                    lines.append(f"  - `[{chk.get('status')}]` {chk.get('concept')} ({chk.get('evidence')})")
                lines.append("")

            lines.append("- **AI Strengths:**")
            for s in item["strengths"]:
                lines.append(f"  - {s}")
            if item["missing_concepts"]:
                lines.append("- **Areas for Improvement / Missing Points:**")
                for m in item["missing_concepts"]:
                    lines.append(f"  - {m}")
            lines.append(f"- **AI Feedback:** {item['feedback']}")
            lines.append(f"- **Key Takeaway:** {item['key_takeaway']}")
            lines.append(f"- **Ideal Reference Model Answer:**\n> {item['reference_answer']}\n")
            lines.append(f"- **AI Model Rewrite (100% Score Formulation):**\n> {item.get('improved_student_rewrite', '')}\n")

    return "\n".join(lines)


def export_report_json() -> str:
    """Generate structured JSON export for LMS and analytics pipelines safely without binary bytes."""
    eval_data = st.session_state.task4_eval_results
    if not eval_data:
        return "{}"
    clean_eval = dict(eval_data)
    clean_details = []
    for d in eval_data.get("details", []):
        item_copy = dict(d)
        if "image_data" in item_copy and isinstance(item_copy["image_data"], dict):
            img_c = dict(item_copy["image_data"])
            img_c.pop("bytes", None)
            item_copy["image_data"] = img_c
        clean_details.append(item_copy)
    clean_eval["details"] = clean_details
    data = {
        "metadata": st.session_state.task4_meta,
        "evaluation": clean_eval,
    }
    return json.dumps(data, indent=2)

# --------------------------------------------------
# 8. Screen 1: Assessment Setup Screen
# --------------------------------------------------

def render_setup_view():
    """Render the configuration screen with Q&A, Mixed mode, and Time limit options."""
    hero(
        title="AI Examination Platform",
        subtitle="Configure technical assessments with objective and written questions.",
    )

    available_providers = get_available_providers()
    default_provider = available_providers[0] if available_providers else "Google (Gemini Flash)"

    with st.container(border=True):
        st.markdown(
            """
            <div style="margin-bottom: 12px;">
                <h4 style="margin: 0; font-size: 1.0rem;">Assessment Setup</h4>
            </div>
            """,
            unsafe_allow_html=True,
        )

        col1, col2 = st.columns([1.5, 1])

        with col1:
            topic_options = [
                "Python",
                "SQL & Databases",
                "Data Structures & Algorithms (DSA)",
                "Java",
                "C++",
                "JavaScript & Web Tech",
                "Operating Systems",
                "Computer Networks",
                "System Design",
                "Object-Oriented Programming (OOP)",
                "Machine Learning & AI",
                "Cloud Computing (AWS/GCP)",
                "Cybersecurity",
                "Other (Custom Subject)",
            ]
            topic = st.selectbox("Subject / Domain", topic_options, index=0)

        with col2:
            difficulty = st.selectbox(
                "Difficulty",
                ["Easy", "Medium", "Hard"],
                index=1,
            )

        custom_topic = ""
        if topic == "Other (Custom Subject)":
            custom_topic = st.text_input(
                "Custom Topic",
                placeholder="e.g. Docker & Kubernetes, React Server Components",
            )

        # Environment & Timer Selection
        env_col, time_col = st.columns(2)
        with env_col:
            exam_type = st.selectbox(
                "Assessment Environment",
                ["Exam Mode (Formal)", "Study Mode (With Hints)"],
                index=0,
                help="Study Mode unlocks conceptual hints for each question during the exam.",
            )
        with time_col:
            time_limit_choice = st.selectbox(
                "Examination Time Limit",
                ["Untimed / Self-Paced", "5 Minutes", "10 Minutes", "15 Minutes", "20 Minutes"],
                index=0,
            )

        time_limit_map = {
            "Untimed / Self-Paced": 0,
            "5 Minutes": 5,
            "10 Minutes": 10,
            "15 Minutes": 15,
            "20 Minutes": 20,
        }
        time_limit_mins = time_limit_map[time_limit_choice]

        # Assessment Format Selection
        mode = st.radio(
            "Question Format",
            [
                "Mixed (MCQs + Q&A Questions)",
                "Q&A Only (Short Answer / Descriptive)",
                "MCQ Only (Multiple Choice)",
            ],
            index=0,
            horizontal=True,
        )

        # Question counts based on mode
        c_mcq, c_qa = st.columns(2)
        if mode == "Mixed (MCQs + Q&A Questions)":
            with c_mcq:
                mcq_cnt = st.number_input("Number of MCQs (1 mark each)", min_value=1, max_value=15, value=3, step=1)
            with c_qa:
                qa_cnt = st.number_input("Number of Q&A Questions (5 marks each)", min_value=1, max_value=10, value=2, step=1)
        elif mode == "Q&A Only (Short Answer / Descriptive)":
            mcq_cnt = 0
            with c_qa:
                qa_cnt = st.number_input("Number of Q&A Questions (5 marks each)", min_value=1, max_value=12, value=3, step=1)
            with c_mcq:
                st.caption("MCQs: Disabled in Q&A Only mode")
        else:  # MCQ Only
            qa_cnt = 0
            with c_mcq:
                mcq_cnt = st.number_input("Number of MCQs (1 mark each)", min_value=1, max_value=25, value=5, step=1)
            with c_qa:
                st.caption("Q&A: Disabled in MCQ Only mode")

        total_qs = int(mcq_cnt + qa_cnt)
        estimated_marks = int(mcq_cnt * 1.0 + qa_cnt * 5.0)

        timer_note = f" • Timer: {time_limit_choice}" if time_limit_mins > 0 else " • Self-Paced"
        st.markdown(
            f"""
            <div style="background: var(--surface-2); border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px; margin: 8px 0 14px 0; font-size: 0.85rem; color: var(--text-muted);">
                Blueprint: <strong style="color: var(--text);">{total_qs} Questions</strong> ({mcq_cnt} MCQs + {qa_cnt} Q&A) • <strong style="color: var(--text);">{estimated_marks} Marks</strong>{timer_note}
            </div>
            """,
            unsafe_allow_html=True,
        )

        start_btn = st.button(
            "Start Examination",
            type="primary",
            use_container_width=True,
        )

        if start_btn:
            final_topic = custom_topic.strip() if topic == "Other (Custom Subject)" else topic

            if not final_topic:
                st.warning("Please enter a custom topic.")
                return

            try:
                with st.spinner(f"Preparing {total_qs} questions ({difficulty}) on '{final_topic}' with AI..."):
                    questions, active_prov = generate_questions_with_fallback(
                        topic=final_topic,
                        difficulty=difficulty,
                        mode=mode,
                        mcq_count=int(mcq_cnt),
                        qa_count=int(qa_cnt),
                        primary_provider=default_provider,
                    )

                # Reset session state with clean session id
                st.session_state.task4_session_id += 1
                st.session_state.task4_questions = questions
                st.session_state.task4_meta = {
                    "topic": final_topic,
                    "difficulty": difficulty,
                    "mode": mode,
                    "exam_type": exam_type,
                    "time_limit_mins": time_limit_mins,
                    "mcq_count": int(mcq_cnt),
                    "qa_count": int(qa_cnt),
                    "total_questions": len(questions),
                    "total_marks": sum(q.get("max_marks", 1.0) for q in questions),
                    "provider": active_prov,
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                }
                st.session_state.task4_user_answers = {i: None for i in range(len(questions))}
                st.session_state.task4_user_images = {}
                st.session_state.task4_start_time = time.time()
                st.session_state.task4_eval_results = None
                st.session_state.task4_stage = "TAKING"
                st.rerun()

            except Exception as error:
                st.error(f"Examination Generation Failed: {error}")

# --------------------------------------------------
# 9. Screen 2: Interactive Exam Interface (MCQ & Q&A)
# --------------------------------------------------

def render_taking_view():
    """Render the live examination interface supporting both MCQ selection and Q&A written inputs."""
    meta = st.session_state.task4_meta
    questions = st.session_state.task4_questions
    session_id = st.session_state.task4_session_id
    total = len(questions)

    # Top Header Bar
    top_c1, top_c2 = st.columns([3, 1.2])
    with top_c1:
        st.markdown(
            f"""
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
                <h3 style="margin: 0; font-size: 1.15rem;">{meta['topic']}</h3>
                <span class="badge">{meta['difficulty']}</span>
                <span style="color: var(--text-muted); font-size: 0.82rem;">{total} Questions • {int(meta['total_marks'])} Marks</span>
            </div>
            """,
            unsafe_allow_html=True,
        )

        limit_mins = meta.get("time_limit_mins", 0)
        start_t = st.session_state.get("task4_start_time")
        if limit_mins > 0 and start_t:
            elapsed = int(time.time() - start_t)
            remaining = max(0, (limit_mins * 60) - elapsed)
            rem_m = remaining // 60
            rem_s = remaining % 60
            timer_text = f"Time Left: {rem_m:02d}:{rem_s:02d}"
            st.markdown(
                f"<div style='margin-top: 4px;'><span class='timer-live-badge'>{timer_text}</span></div>",
                unsafe_allow_html=True,
            )

    with top_c2:
        if st.button("Quit", type="secondary", use_container_width=True, help="Discard current assessment"):
            st.session_state.task4_stage = "SETUP"
            st.rerun()

    # Progress Bar
    answered_count = sum(
        1 for ans in st.session_state.task4_user_answers.values()
        if ans is not None and str(ans).strip() != ""
    )
    pct_complete = (answered_count / total) if total > 0 else 0.0

    st.markdown("<div style='margin-top: 6px;'></div>", unsafe_allow_html=True)
    st.progress(pct_complete, text=f"Progress: {answered_count} of {total} answered")

    # Question Navigator Quick Strip
    nav_chips_html = []
    for i, q in enumerate(questions):
        ans = st.session_state.task4_user_answers.get(i)
        has_img = (i in st.session_state.task4_user_images)

        if ans is not None and str(ans).strip() != "":
            nav_chips_html.append(f"<span class='q-nav-chip q-nav-done'>Q{i+1} ✓</span>")
        elif has_img:
            nav_chips_html.append(f"<span class='q-nav-chip q-nav-done'>Q{i+1} [Img]</span>")
        else:
            nav_chips_html.append(f"<span class='q-nav-chip q-nav-pending'>Q{i+1}</span>")

    st.markdown(
        f"""
        <div style="background: var(--surface-2); border: 1px solid var(--border-soft); border-radius: 6px; padding: 6px 10px; margin: 8px 0 14px 0;">
            <div style="display: flex; flex-wrap: wrap; align-items: center;">
                <span style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600; margin-right: 8px;">Questions:</span>
                {' '.join(nav_chips_html)}
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.divider()

    # Render Question Cards
    is_study_mode = "Study" in meta.get("exam_type", "")

    for idx, q in enumerate(questions):
        saved_val = st.session_state.task4_user_answers.get(idx)
        saved_img = st.session_state.task4_user_images.get(idx)
        q_type = q.get("type", "mcq")
        marks = q.get("max_marks", 1.0)

        with st.container(border=True):
            qc1, qc2 = st.columns([4, 1.8])
            with qc1:
                badge_type = "MCQ" if q_type == "mcq" else "Q&A"
                st.markdown(
                    f"""
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                        <span class="badge">{badge_type}</span>
                        <span class="badge">{marks} Mark{'s' if marks != 1 else ''}</span>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )
                st.markdown(f"#### Q{idx + 1}. {q['question']}")

            with qc2:
                if saved_val is not None and str(saved_val).strip() != "":
                    if q_type == "mcq":
                        st.markdown(
                            f"<div style='text-align: right;'><span class='badge badge-success'>Option {saved_val}</span></div>",
                            unsafe_allow_html=True,
                        )
                    else:
                        w_cnt = len(str(saved_val).split())
                        st.markdown(
                            f"<div style='text-align: right;'><span class='badge badge-success'>{w_cnt} Words</span></div>",
                            unsafe_allow_html=True,
                        )
                elif saved_img:
                    st.markdown(
                        "<div style='text-align: right;'><span class='badge badge-success'>Image Attached</span></div>",
                        unsafe_allow_html=True,
                    )
                else:
                    st.markdown(
                        "<div style='text-align: right;'><span class='badge'>Pending</span></div>",
                        unsafe_allow_html=True,
                    )

            if is_study_mode and q.get("hint"):
                with st.expander("Hint (Study Mode)"):
                    st.info(q["hint"])

            if q_type == "mcq":
                options_dict = q["options"]
                letters = ["A", "B", "C", "D"]
                radio_key = f"t4_radio_{session_id}_{idx}"
                selected_index = letters.index(saved_val) if saved_val in letters else None

                choice = st.radio(
                    label=f"Options for Q{idx + 1}",
                    options=letters,
                    index=selected_index,
                    format_func=lambda l: f"{l})  {options_dict[l]}",
                    key=radio_key,
                    label_visibility="collapsed",
                )

                if choice != saved_val:
                    st.session_state.task4_user_answers[idx] = choice

                if saved_val is not None:
                    if st.button("Clear", key=f"clear_mcq_{session_id}_{idx}", type="secondary"):
                        st.session_state.task4_user_answers[idx] = None
                        if radio_key in st.session_state:
                            del st.session_state[radio_key]
                        st.rerun()

            else:  # "qa"
                st.caption(f"Type your written response below. (Recommended: {q.get('recommended_words', '40–90 words')})")

                text_key = f"t4_text_{session_id}_{idx}"
                if text_key not in st.session_state:
                    st.session_state[text_key] = saved_val if saved_val is not None else ""

                written_text = st.text_area(
                    label=f"Your Answer for Q{idx + 1}",
                    value=st.session_state[text_key],
                    height=130,
                    placeholder="Type your explanation or technical answer here...",
                    key=text_key,
                    label_visibility="collapsed",
                )
                st.session_state.task4_user_answers[idx] = written_text

                words = len(written_text.strip().split()) if written_text.strip() else 0
                c_info, c_clr = st.columns([3, 1])
                with c_info:
                    st.markdown(
                        f"<small style='color: var(--text-muted);'>{words} words</small>",
                        unsafe_allow_html=True,
                    )
                with c_clr:
                    if written_text.strip():
                        if st.button("Clear Response", key=f"clear_qa_{session_id}_{idx}", type="secondary"):
                            st.session_state.task4_user_answers[idx] = ""
                            st.session_state[text_key] = ""
                            st.rerun()

    st.divider()

    # Submission Bar
    unanswered_count = total - answered_count

    if st.session_state.task4_stage == "CONFIRM_SUBMIT":
        unanswered_indices = [
            f"Q{i+1}"
            for i, a in st.session_state.task4_user_answers.items()
            if a is None or str(a).strip() == ""
        ]
        st.warning(
            f"You have {unanswered_count} unanswered question(s) ({', '.join(unanswered_indices)}). "
            "Unanswered questions will receive 0 marks."
        )

        c_col1, c_col2 = st.columns(2)
        with c_col1:
            if st.button("Confirm & Submit", type="primary", use_container_width=True):
                st.session_state.task4_stage = "EVALUATING"
                st.rerun()

        with c_col2:
            if st.button("Return to Exam", use_container_width=True):
                st.session_state.task4_stage = "TAKING"
                st.rerun()

    else:
        sub_col1, sub_col2 = st.columns([2, 1])

        with sub_col1:
            submit_btn = st.button(
                "Submit Examination",
                type="primary",
                use_container_width=True,
            )

        with sub_col2:
            if st.button("Reset All", use_container_width=True, help="Clear all answers"):
                st.session_state.task4_session_id += 1
                st.session_state.task4_user_answers = {i: None for i in range(total)}
                st.rerun()

        if submit_btn:
            fresh_answered = sum(
                1 for ans in st.session_state.task4_user_answers.values()
                if ans is not None and str(ans).strip() != ""
            )
            if fresh_answered < total:
                st.session_state.task4_stage = "CONFIRM_SUBMIT"
                st.rerun()
            else:
                st.session_state.task4_stage = "EVALUATING"
                st.rerun()

# --------------------------------------------------
# 10. Screen 3: Intermediate Evaluation Screen with Progress
# --------------------------------------------------

def render_evaluating_view():
    """Render progress indicator while the AI examiner evaluates responses."""
    hero(
        title="Evaluation in Progress",
        subtitle="Analyzing objective and written responses with AI...",
    )

    with st.container(border=True):
        status_text = st.empty()
        status_text.markdown("#### Evaluating assessment responses...")
        p_bar = st.progress(0.0)

        try:
            compute_comprehensive_evaluation(progress_bar=p_bar, status_text=status_text)
            st.session_state.task4_stage = "EVALUATED"
            st.rerun()
        except Exception as err:
            st.error(f"Evaluation error: {err}")
            if st.button("Try Submitting Again"):
                st.session_state.task4_stage = "TAKING"
                st.rerun()

# --------------------------------------------------
# 11. Screen 4: Assessment Diagnostic Evaluation Screen
# --------------------------------------------------

def render_evaluation_view():
    """Render scorecard and diagnostic feedback for both MCQs and Q&A."""
    eval_data = st.session_state.task4_eval_results
    meta = st.session_state.task4_meta

    if not eval_data:
        st.session_state.task4_stage = "SETUP"
        st.rerun()
        return

    # Evaluation Hero Header
    hero(
        title="Assessment Results",
        subtitle=f"{meta.get('topic')} • {meta.get('difficulty')} • {meta.get('timestamp')}",
    )

    total_score = eval_data["total_score"]
    total_max = eval_data["total_max"]
    pct = eval_data["combined_percentage"]
    tier_title = eval_data["tier_title"]
    verdict = eval_data["verdict"]

    # Scorecard Summary Card
    st.markdown(
        f"""
        <div class="eval-hero-banner">
            <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); font-weight: 600; margin-bottom: 2px;">
                Scorecard Summary
            </div>
            <div style="font-size: 2.2rem; font-weight: 700; color: var(--text); margin: 4px 0; font-family: var(--font-head); line-height: 1.1;">
                {total_score} <span style="font-size: 1.2rem; color: var(--text-muted); font-weight: 400;">/ {total_max} Marks</span>
                <span style="font-size: 1.3rem; margin-left: 10px; font-weight: 600; color: var(--accent);">({pct}%)</span>
            </div>
            <div style="display: inline-block; background: var(--surface-2); border: 1px solid var(--border); border-radius: 4px; padding: 2px 10px; margin: 4px 0; font-weight: 600; font-size: 0.80rem; color: var(--text);">
                {tier_title}
            </div>
            <div style="color: var(--text-muted); font-size: 0.86rem; max-width: 620px; margin: 6px auto 0; line-height: 1.5;">
                {verdict}
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # 4-Column Diagnostic Analytics
    m1, m2, m3, m4 = st.columns(4)
    with m1:
        st.metric("Total Score", f"{total_score} / {total_max}")
    with m2:
        if eval_data["mcq_max"] > 0:
            st.metric("MCQ Score", f"{eval_data['mcq_score']} / {eval_data['mcq_max']}")
        else:
            st.metric("MCQs", "None")
    with m3:
        if eval_data["qa_max"] > 0:
            st.metric("Q&A Score", f"{eval_data['qa_score']} / {eval_data['qa_max']}")
        else:
            st.metric("Q&A", "None")
    with m4:
        st.metric("Time Taken", f"{eval_data.get('time_taken')}")

    st.divider()

    # Detailed Question Diagnostics
    st.subheader("Question Diagnostics")

    qa_items = [d for d in eval_data["details"] if d["type"] == "qa"]
    mcq_items = [d for d in eval_data["details"] if d["type"] == "mcq"]
    weak_items = [d for d in eval_data["details"] if not d["is_correct"]]

    tabs = st.tabs([
        f"All ({len(eval_data['details'])})",
        f"Q&A ({len(qa_items)})",
        f"MCQs ({len(mcq_items)})",
        f"Review Needed ({len(weak_items)})",
    ])

    def render_eval_option(letter: str, opt_text: str, is_correct: bool, is_user_pick: bool) -> str:
        """Format option card with clean visual styling."""
        if is_correct and is_user_pick:
            bg = "var(--success-soft)"
            border = "1px solid rgba(16, 185, 129, 0.4)"
            badge_html = "<span class='badge badge-success'>Your Choice (Correct)</span>"
        elif is_correct:
            bg = "var(--success-soft)"
            border = "1px solid rgba(16, 185, 129, 0.3)"
            badge_html = "<span class='badge badge-success'>Correct</span>"
        elif is_user_pick:
            bg = "var(--danger-soft)"
            border = "1px solid rgba(239, 68, 68, 0.4)"
            badge_html = "<span class='badge badge-danger'>Your Choice</span>"
        else:
            bg = "var(--surface-2)"
            border = "1px solid var(--border-soft)"
            badge_html = ""

        return (
            f"<div style='display: flex; justify-content: space-between; align-items: center; "
            f"background: {bg}; border: {border}; border-radius: 6px; padding: 7px 12px; margin: 4px 0; "
            f"color: var(--text); font-size: 0.88rem;'>"
            f"<div><strong style='color: var(--accent); margin-right: 6px;'>{letter})</strong> {opt_text}</div>"
            f"<div>{badge_html}</div>"
            f"</div>"
        )

    def render_qa_card(item: dict):
        """Format a clean multidimensional Q&A evaluation card."""
        score = item["score"]
        max_marks = item["max_marks"]
        pct = item["percentage"]
        status = item["status"]

        if status == "FULL_MARKS" or pct >= 85:
            status_badge = "<span class='badge badge-success'>Full Marks</span>"
        elif status == "PARTIAL_MARKS" or pct >= 40:
            status_badge = "<span class='badge badge-warn'>Partial Marks</span>"
        elif status == "SKIPPED":
            status_badge = "<span class='badge'>Skipped</span>"
        else:
            status_badge = "<span class='badge badge-danger'>Insufficient</span>"

        with st.container(border=True):
            top_c1, top_c2 = st.columns([4, 1.4])
            with top_c1:
                st.markdown(
                    f"""
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                        <span class="badge">Q&A</span>
                        {status_badge}
                        <span style="color: var(--text); font-weight: 600; font-size: 0.88rem;">
                            Score: {score} / {max_marks} Marks ({pct}%)
                        </span>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )
                st.markdown(f"#### Q{item['index']}. {item['question']}")

            with top_c2:
                st.markdown(
                    f"""
                    <div style="text-align: right;">
                        <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Accuracy</div>
                        <div style="font-weight: 600; color: var(--text); font-size: 0.90rem;">{item.get('accuracy_tier', 'N/A')}</div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

            # Image & Extracted Text
            img_data = item.get("image_data")
            if img_data:
                st.markdown(
                    """
                    <div style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin: 6px 0 3px 0;">
                        Attached Answer Sheet & Extracted Text:
                    </div>
                    """,
                    unsafe_allow_html=True,
                )
                img_c1, img_c2 = st.columns([1, 1.4])
                with img_c1:
                    st.image(
                        img_data["bytes"],
                        caption=img_data.get('name', 'Image'),
                        use_container_width=True,
                    )
                with img_c2:
                    ocr_txt = img_data.get("extracted_text", "")
                    w_cnt = len(ocr_txt.split()) if ocr_txt else 0
                    st.markdown(
                        f"""
                        <div class="image-ocr-portion" style="margin-top: 0;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <span class="ocr-badge">Extracted Text</span>
                                <span style="font-size: 0.72rem; color: var(--text-muted);">{w_cnt} words</span>
                            </div>
                            <div class="ocr-text-box" style="max-height: 160px; overflow-y: auto;">{ocr_txt}</div>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )

            # Student Response Box
            user_ans = item["user_answer"]
            ans_display = user_ans.strip() if (user_ans and str(user_ans).strip()) else "*(No response submitted - question skipped)*"
            st.markdown(
                f"""
                <div style="background: var(--surface-2); border: 1px solid var(--border-soft); border-radius: 6px; padding: 10px 12px; margin: 8px 0;">
                    <div style="font-size: 0.74rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 3px;">
                        Submitted Response:
                    </div>
                    <div style="color: var(--text); font-size: 0.88rem; white-space: pre-wrap; line-height: 1.5;">{ans_display}</div>
                </div>
                """,
                unsafe_allow_html=True,
            )

            # 4-Dimension Academic Scoring Breakdown
            dims = item.get("dimensions", {})
            if dims:
                st.markdown(
                    """
                    <div style="font-size: 0.74rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin: 8px 0 4px 0;">
                        Evaluation Criteria Breakdown:
                    </div>
                    """,
                    unsafe_allow_html=True,
                )
                d_col1, d_col2, d_col3, d_col4 = st.columns(4)

                dim_titles = {
                    "accuracy": ("Accuracy", d_col1),
                    "completeness": ("Completeness", d_col2),
                    "clarity": ("Clarity", d_col3),
                    "application": ("Application", d_col4),
                }

                for key, (label, col) in dim_titles.items():
                    d_info = dims.get(key, {})
                    d_s = float(d_info.get("score", 0.0))
                    d_m = float(d_info.get("max", 1.0))
                    d_comm = d_info.get("comment", "")
                    with col:
                        st.markdown(
                            f"""
                            <div class="dim-card">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                                    <span style="font-weight: 600; font-size: 0.78rem; color: var(--text);">{label}</span>
                                    <span style="font-weight: 600; font-size: 0.80rem; color: var(--accent);">{d_s} / {d_m}</span>
                                </div>
                                <div style="font-size: 0.73rem; color: var(--text-muted); line-height: 1.3;">{d_comm}</div>
                            </div>
                            """,
                            unsafe_allow_html=True,
                        )

            # Concept Coverage Checklist Matrix
            checklist = item.get("concept_checklist", [])
            if checklist:
                st.markdown(
                    """
                    <div style="font-size: 0.74rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin: 10px 0 4px 0;">
                        Key Concepts Assessed:
                    </div>
                    """,
                    unsafe_allow_html=True,
                )
                tags_html = []
                for chk in checklist:
                    c_status = chk.get("status", "MISSED").upper()
                    c_name = chk.get("concept", "")
                    if c_status == "COVERED":
                        tags_html.append(f"<span class='concept-tag concept-covered'>✓ {c_name}</span>")
                    elif c_status == "PARTIAL":
                        tags_html.append(f"<span class='concept-tag concept-partial'>~ {c_name}</span>")
                    else:
                        tags_html.append(f"<span class='concept-tag concept-missed'>✗ {c_name}</span>")

                st.markdown(f"<div style='margin-bottom: 6px;'>{' '.join(tags_html)}</div>", unsafe_allow_html=True)

            # Strengths & Improvement Points
            eval_col1, eval_col2 = st.columns(2)
            with eval_col1:
                st.markdown(
                    """
                    <div style="font-size: 0.74rem; font-weight: 600; text-transform: uppercase; color: var(--success); margin-bottom: 3px;">
                        Strengths:
                    </div>
                    """,
                    unsafe_allow_html=True,
                )
                for s in item.get("strengths", []):
                    st.markdown(f"- <span style='font-size: 0.85rem; color: var(--text);'>{s}</span>", unsafe_allow_html=True)

            with eval_col2:
                missing = item.get("missing_concepts", [])
                st.markdown(
                    """
                    <div style="font-size: 0.74rem; font-weight: 600; text-transform: uppercase; color: var(--warn); margin-bottom: 3px;">
                        Points to Improve:
                    </div>
                    """,
                    unsafe_allow_html=True,
                )
                if missing:
                    for m in missing:
                        st.markdown(f"- <span style='font-size: 0.85rem; color: var(--text);'>{m}</span>", unsafe_allow_html=True)
                else:
                    st.markdown("<span style='font-size: 0.85rem; color: var(--success);'>Full conceptual coverage achieved.</span>", unsafe_allow_html=True)

            # AI Constructive Feedback Note
            st.markdown(
                f"""
                <div style="background: var(--surface-2); border-left: 3px solid var(--accent); padding: 7px 10px; border-radius: 4px; margin: 8px 0 4px 0;">
                    <strong style="color: var(--accent); font-size: 0.82rem;">Feedback:</strong>
                    <span style="color: var(--text); font-size: 0.85rem; margin-left: 6px;">{item.get('feedback', '')}</span>
                </div>
                """,
                unsafe_allow_html=True,
            )

            # Prominent Correct / Ideal Reference Model Answer
            ref_ans = item.get("reference_answer", "").strip()
            key_c = item.get("key_concepts", [])
            st.markdown(
                f"""
                <div style="background: rgba(16, 185, 129, 0.07); border: 1px solid rgba(16, 185, 129, 0.35); border-left: 4px solid var(--success); border-radius: 6px; padding: 11px 14px; margin: 10px 0 6px 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <span style="font-size: 0.76rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--success);">
                            ✓ Correct Answer / Ideal Model Solution:
                        </span>
                        <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 500;">
                            100% Score Standard
                        </span>
                    </div>
                    <div style="color: var(--text); font-size: 0.88rem; line-height: 1.6; white-space: pre-wrap;">{ref_ans}</div>
                    {f'<div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 0.76rem; color: var(--text-muted);"><strong style="color: var(--text);">Key Concepts Expected:</strong> {", ".join(key_c)}</div>' if key_c else ''}
                </div>
                """,
                unsafe_allow_html=True,
            )

            # AI Student Response Enhancement (Polished Rewrite)
            rewrite = item.get("improved_student_rewrite")
            user_words = len(str(item.get("user_answer", "")).strip().split())
            if rewrite and rewrite != ref_ans and user_words >= 3 and status != "FULL_MARKS":
                st.markdown(
                    f"""
                    <div class="rewrite-card" style="margin-top: 8px;">
                        <div style="font-size: 0.74rem; font-weight: 600; text-transform: uppercase; color: var(--accent); margin-bottom: 3px;">
                            AI Formulation (Your Answer Polished for 100% Score):
                        </div>
                        <div style="color: var(--text); font-size: 0.86rem; line-height: 1.5; font-style: italic;">
                            "{rewrite}"
                        </div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

            # Grading Rubric Expander
            with st.expander("Grading Rubric & Benchmark Criteria"):
                st.markdown(f"**Core Concepts Evaluated:** {', '.join(item['key_concepts'])}")
                st.markdown(f"**Grading Rubric:** {item.get('rubric', 'Conceptual clarity and completeness.')}")

    def render_mcq_card(item: dict):
        """Format an MCQ evaluation card."""
        q_num = item["index"]
        status = item["status"]
        correct_ans = item["correct_answer"]
        user_ans = item["user_answer"]
        options = item["options"]

        with st.container(border=True):
            top_c1, top_c2 = st.columns([4, 1.5])
            with top_c1:
                st.markdown(f"#### Q{q_num}. {item['question']}")
            with top_c2:
                if status == "CORRECT":
                    st.markdown(
                        "<div style='text-align: right;'><span class='badge badge-success'>Correct (+1)</span></div>",
                        unsafe_allow_html=True,
                    )
                elif status == "WRONG":
                    st.markdown(
                        "<div style='text-align: right;'><span class='badge badge-danger'>Incorrect (0)</span></div>",
                        unsafe_allow_html=True,
                    )
                else:
                    st.markdown(
                        "<div style='text-align: right;'><span class='badge'>Skipped (0)</span></div>",
                        unsafe_allow_html=True,
                    )

            # Options
            for letter in ["A", "B", "C", "D"]:
                opt_text = options.get(letter, "")
                is_this_correct = (letter == correct_ans)
                is_this_user_pick = (letter == user_ans)
                st.markdown(
                    render_eval_option(letter, opt_text, is_this_correct, is_this_user_pick),
                    unsafe_allow_html=True,
                )

            # Explicit Correct Answer Callout
            correct_text = options.get(correct_ans, "")
            st.markdown(
                f"""
                <div style="background: rgba(16, 185, 129, 0.07); border: 1px solid rgba(16, 185, 129, 0.35); border-left: 4px solid var(--success); border-radius: 6px; padding: 7px 12px; margin: 8px 0 4px 0; font-size: 0.86rem;">
                    <strong style="color: var(--success); text-transform: uppercase; font-size: 0.76rem; letter-spacing: 0.04em;">✓ Correct Answer:</strong>
                    <span style="color: var(--text); font-weight: 600; margin-left: 6px;">Option {correct_ans}</span>
                    <span style="color: var(--text-muted); margin-left: 4px;">&mdash; {correct_text}</span>
                </div>
                """,
                unsafe_allow_html=True,
            )

            # Conceptual Rationale
            st.markdown(
                f"""
                <div style="background: var(--surface-2); border-left: 3px solid var(--accent); padding: 7px 10px; border-radius: 4px; margin-top: 6px;">
                    <span style="color: var(--accent); font-weight: 600; font-size: 0.82rem;">Explanation:</span>
                    <span style="color: var(--text); font-size: 0.85rem; margin-left: 6px;">{item['explanation']}</span>
                </div>
                """,
                unsafe_allow_html=True,
            )

    def render_list(items_to_render: List[dict]):
        if not items_to_render:
            st.info("No questions in this filter view.")
            return
        for item in items_to_render:
            if item["type"] == "qa":
                render_qa_card(item)
            else:
                render_mcq_card(item)

    with tabs[0]:
        render_list(eval_data["details"])

    with tabs[1]:
        render_list(qa_items)

    with tabs[2]:
        render_list(mcq_items)

    with tabs[3]:
        render_list(weak_items)

    st.divider()

    # Post-Evaluation Actions
    st.subheader("Actions")

    act_col1, act_col2 = st.columns(2)
    with act_col1:
        if st.button("Retake Assessment", type="primary", use_container_width=True, help="Retest the same questions"):
            st.session_state.task4_session_id += 1
            st.session_state.task4_user_answers = {i: None for i in range(len(st.session_state.task4_questions))}
            st.session_state.task4_user_images = {}
            st.session_state.task4_start_time = time.time()
            st.session_state.task4_eval_results = None
            st.session_state.task4_stage = "TAKING"
            st.rerun()

    with act_col2:
        if st.button("New Assessment", use_container_width=True, help="Configure a new assessment"):
            st.session_state.task4_session_id += 1
            st.session_state.task4_questions = []
            st.session_state.task4_user_answers = {}
            st.session_state.task4_user_images = {}
            st.session_state.task4_eval_results = None
            st.session_state.task4_stage = "SETUP"
            st.rerun()

    # Dual Export Row
    exp_col1, exp_col2 = st.columns(2)
    with exp_col1:
        report_md = export_report_markdown()
        file_name_md = f"Exam_Report_{meta.get('topic', 'Assessment').replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        st.download_button(
            label="Download Report (.md)",
            data=report_md,
            file_name=file_name_md,
            mime="text/markdown",
            use_container_width=True,
        )

    with exp_col2:
        report_json = export_report_json()
        file_name_json = f"Exam_Data_{meta.get('topic', 'Assessment').replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        st.download_button(
            label="Export Data (.json)",
            data=report_json,
            file_name=file_name_json,
            mime="application/json",
            use_container_width=True,
        )

# --------------------------------------------------
# 12. Master Router
# --------------------------------------------------

def main():
    init_session_state()
    stage = st.session_state.task4_stage

    if stage in ["TAKING", "CONFIRM_SUBMIT"] and st.session_state.task4_questions:
        render_taking_view()
    elif stage == "EVALUATING":
        render_evaluating_view()
    elif stage == "EVALUATED" and st.session_state.task4_eval_results:
        render_evaluation_view()
    else:
        render_setup_view()


if __name__ == "__main__":
    main()

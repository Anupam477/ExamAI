"""
AI-Based Intelligent Examination Platform
Milestone 1 - Task 3: Interactive Examination & Evaluation Suite (Ultra-Premium Edition)
"""

import json
import os
import re
import time
from datetime import datetime
from typing import Any, Dict, List, Optional

import streamlit as st
from dotenv import load_dotenv
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
        page_title="AI Examination & Evaluation | Task 3",
        page_icon="🎓",
        layout="centered",
    )
except Exception:
    pass

# Load styling
try:
    from styles import load_styles, hero, result_box
except ImportError:
    from milestone1.styles import load_styles, hero, result_box

load_styles()

# --------------------------------------------------
# 2. Resilient State Management
# --------------------------------------------------

def init_session_state():
    """Initialize all persistent state variables with session isolation."""
    if "test_stage" not in st.session_state:
        # Stages: "SETUP", "TAKING", "CONFIRM_SUBMIT", "EVALUATED"
        st.session_state.test_stage = "SETUP"

    if "exam_session_id" not in st.session_state:
        # Incremented on retake or new test to ensure 100% clean widget key isolation
        st.session_state.exam_session_id = 1

    if "exam_questions" not in st.session_state:
        st.session_state.exam_questions = []

    if "exam_meta" not in st.session_state:
        st.session_state.exam_meta = {
            "topic": "",
            "difficulty": "",
            "count": 5,
            "provider": "",
            "timestamp": "",
        }

    if "user_answers" not in st.session_state:
        st.session_state.user_answers = {}

    if "exam_start_time" not in st.session_state:
        st.session_state.exam_start_time = None

    if "eval_results" not in st.session_state:
        st.session_state.eval_results = None


init_session_state()

# --------------------------------------------------
# 3. AI Providers with Automatic Fallback
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


def build_llm(provider_name: str):
    """Instantiate LangChain model for the requested provider."""
    if provider_name == "OpenAI (ChatGPT)":
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY is not configured in .env.")
        model_name = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        return ChatOpenAI(
            model=model_name,
            api_key=api_key,
            temperature=0.2,
        )

    # Google Gemini
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY is not configured in .env.")
    model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
    return ChatGoogleGenerativeAI(
        model=model_name,
        google_api_key=api_key,
        temperature=0.2,
    )

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

    # Clean trailing commas in objects or arrays
    json_str = re.sub(r",\s*([\]}])", r"\1", json_str)

    try:
        return json.loads(json_str, strict=False)
    except json.JSONDecodeError:
        pass

    sanitized = re.sub(r"[\x00-\x1f\x7f-\x9f]", lambda m: "\\n" if m.group(0) == "\n" else " ", json_str)
    try:
        return json.loads(sanitized, strict=False)
    except json.JSONDecodeError as err:
        raise ValueError(f"Failed to parse JSON response: {err}") from err


def validate_questions(data: dict, total: int) -> List[Dict[str, Any]]:
    """Validate structure, sanitize options (A-D), and normalize correct answer."""
    questions = data.get("questions")
    if not isinstance(questions, list):
        raise ValueError("Model response did not contain a 'questions' list.")

    if len(questions) > total:
        questions = questions[:total]
    elif len(questions) != total and not questions:
        raise ValueError(f"Expected {total} questions, but received none.")

    required_keys = ["A", "B", "C", "D"]
    cleaned_questions = []

    for idx, q in enumerate(questions, start=1):
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

        # Correct Answer Normalization
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

        cleaned_questions.append({
            "id": idx,
            "question": q_text,
            "options": options,
            "answer": ans,
            "explanation": explanation,
        })

    if not cleaned_questions:
        raise ValueError("Unable to parse valid MCQ questions from the model output.")

    return cleaned_questions


def generate_mcqs_with_fallback(topic: str, difficulty: str, count: int, primary_provider: str) -> tuple[List[Dict[str, Any]], str]:
    """Generate MCQs with automatic provider fallback if the primary provider hits quota/errors."""
    system_prompt = """
You are an expert academic examiner designing multiple-choice assessment questions.

Create educational, single-best-answer MCQs matching the requested topic and difficulty.

Return ONLY a valid JSON object matching this schema:
{
  "questions": [
    {
      "question": "Question statement (support markdown for code if relevant)",
      "options": {
        "A": "Option A",
        "B": "Option B",
        "C": "Option C",
        "D": "Option D"
      },
      "answer": "A",
      "explanation": "Clear explanation of why this option is correct and key conceptual takeaways."
    }
  ]
}

Rules:
- Output valid JSON only, without markdown fences or extraneous text.
- Provide exactly the requested number of questions.
- Every question must have exactly 4 options: A, B, C, and D.
- The answer must be strictly one letter: 'A', 'B', 'C', or 'D'.
- Calibrate question depth to the requested difficulty level.
"""

    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessage(content=system_prompt),
            (
                "human",
                "Generate an examination on:\n"
                "- Topic: {topic}\n"
                "- Difficulty: {difficulty}\n"
                "- Number of Questions: {count}\n\n"
                "Return the JSON now.",
            ),
        ]
    )

    all_providers = get_available_providers()
    providers_to_try = [primary_provider] + [p for p in all_providers if p != primary_provider]

    last_error = None
    for prov in providers_to_try:
        try:
            llm = build_llm(prov)
            chain = prompt | llm
            response = chain.invoke({
                "topic": topic,
                "difficulty": difficulty,
                "count": count,
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
            qs = validate_questions(data, count)
            return qs, prov

        except Exception as err:
            last_error = err
            continue

    raise RuntimeError(f"All AI providers failed. Last error: {last_error}")

# --------------------------------------------------
# 5. Evaluation Analytics
# --------------------------------------------------

def compute_evaluation_data():
    """Calculate comprehensive score, timings, and diagnostic details."""
    questions = st.session_state.exam_questions
    user_answers = st.session_state.user_answers
    total = len(questions)

    correct_count = 0
    wrong_count = 0
    skipped_count = 0
    details = []

    for idx, q in enumerate(questions):
        user_choice = user_answers.get(idx)
        correct_choice = q["answer"]

        if user_choice is None:
            status = "SKIPPED"
            skipped_count += 1
            is_correct = False
        elif user_choice == correct_choice:
            status = "CORRECT"
            correct_count += 1
            is_correct = True
        else:
            status = "WRONG"
            wrong_count += 1
            is_correct = False

        details.append({
            "index": idx + 1,
            "question": q["question"],
            "options": q["options"],
            "correct_answer": correct_choice,
            "user_answer": user_choice,
            "is_correct": is_correct,
            "status": status,
            "explanation": q["explanation"],
        })

    percentage = round((correct_count / total * 100), 1) if total > 0 else 0.0

    # Elapsed time calculation
    start_time = st.session_state.get("exam_start_time")
    if start_time:
        elapsed_seconds = int(time.time() - start_time)
        m = elapsed_seconds // 60
        s = elapsed_seconds % 60
        time_str = f"{m}m {s:02d}s" if m > 0 else f"{s}s"
        pace_str = f"{round(elapsed_seconds / total, 1)}s/q" if total > 0 else "N/A"
    else:
        time_str = "N/A"
        pace_str = "N/A"

    # Performance Tier & Verdict
    if percentage >= 90:
        tier_title = "🏆 TIER S • OUTSTANDING MASTERY"
        verdict = "Exceptional conceptual clarity and flawless execution. Outstanding subject mastery!"
        verdict_color = "#35E0A1"
    elif percentage >= 75:
        verdict = "Strong competence across core concepts. Well above passing proficiency!"
        tier_title = "🌟 TIER A • ADVANCED COMPETENCY"
        verdict_color = "#7C83FF"
    elif percentage >= 50:
        verdict = "Passing baseline achieved. Review the missed concept explanations to strengthen foundation."
        tier_title = "🎯 TIER B • PASSING STANDARD"
        verdict_color = "#FFC857"
    else:
        verdict = "Needs structured revision. Study the detailed rationale below and retake the assessment."
        tier_title = "💡 TIER C • REVISION RECOMMENDED"
        verdict_color = "#FF6B8A"

    st.session_state.eval_results = {
        "score": correct_count,
        "total": total,
        "percentage": percentage,
        "correct_count": correct_count,
        "wrong_count": wrong_count,
        "skipped_count": skipped_count,
        "time_taken": time_str,
        "pace": pace_str,
        "tier_title": tier_title,
        "verdict": verdict,
        "verdict_color": verdict_color,
        "details": details,
    }


def export_report_markdown() -> str:
    """Format a detailed downloadable markdown examination report."""
    eval_data = st.session_state.eval_results
    meta = st.session_state.exam_meta

    if not eval_data:
        return "No evaluation data."

    lines = [
        "# AI Examination Platform — Diagnostic Performance Report",
        f"- **Date & Time:** {meta.get('timestamp')}",
        f"- **Subject/Topic:** {meta.get('topic')}",
        f"- **Difficulty Level:** {meta.get('difficulty')}",
        f"- **AI Engine:** {meta.get('provider')}",
        f"- **Time Spent:** {eval_data.get('time_taken')} (Average: {eval_data.get('pace')})",
        "",
        "## Performance Summary",
        f"- **Final Score:** {eval_data['score']} / {eval_data['total']} ({eval_data['percentage']}%)",
        f"- **Performance Rating:** {eval_data['tier_title']}",
        f"- **Correct Answers:** {eval_data['correct_count']} ({int(eval_data['correct_count']/eval_data['total']*100)}%)",
        f"- **Incorrect Answers:** {eval_data['wrong_count']} ({int(eval_data['wrong_count']/eval_data['total']*100)}%)",
        f"- **Skipped Questions:** {eval_data['skipped_count']}",
        f"- **Diagnostic Verdict:** {eval_data['verdict']}",
        "",
        "---",
        "## Detailed Question Breakdown",
        "",
    ]

    for item in eval_data["details"]:
        lines.append(f"### Q{item['index']}. {item['question']}")
        lines.append(f"- **Result:** `{item['status']}`")
        lines.append(f"- **Your Answer:** {item['user_answer'] or 'None (Skipped)'}")
        lines.append(f"- **Correct Answer:** {item['correct_answer']}) {item['options'].get(item['correct_answer'])}")
        lines.append(f"- **Explanation:** {item['explanation']}")
        lines.append("")

    return "\n".join(lines)

# --------------------------------------------------
# 6. Screen 1: Ultra-Premium Setup Screen
# --------------------------------------------------

def render_setup_view():
    """Render the configuration screen with compact aesthetics."""
    hero(
        title="AI Examination Platform",
        subtitle="Select your subject, difficulty, and question count to begin.",
        badge="Task 3",
    )

    available_providers = get_available_providers()
    default_provider = available_providers[0] if available_providers else "Google (Gemini Flash)"

    with st.container(border=True):
        st.markdown(
            """
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h4 style="margin: 0; font-size: 1.05rem;">⚙️ Assessment Parameters</h4>
                <span class="badge badge-accent">Interactive Engine</span>
            </div>
            """,
            unsafe_allow_html=True,
        )

        # Subject, Difficulty, and Question count all in ONE LINE
        col1, col2, col3 = st.columns([1.6, 1, 1])

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

        with col3:
            count = st.number_input(
                "Questions",
                min_value=1,
                max_value=25,
                value=5,
                step=1,
            )

        custom_topic = ""
        if topic == "Other (Custom Subject)":
            custom_topic = st.text_input(
                "Enter Custom Examination Topic",
                placeholder="e.g. Next.js App Router, Docker & Microservices, LLM Prompt Engineering",
            )

        st.markdown("<div style='margin-top: 6px;'></div>", unsafe_allow_html=True)

        start_btn = st.button(
            "🚀 Start Examination",
            type="primary",
            use_container_width=True,
        )

        if start_btn:
            final_topic = custom_topic.strip() if topic == "Other (Custom Subject)" else topic

            if not final_topic:
                st.warning("Please specify a custom topic.")
                return

            try:
                with st.spinner(f"Preparing {count} {difficulty} questions for '{final_topic}'..."):
                    questions, active_prov = generate_mcqs_with_fallback(
                        topic=final_topic,
                        difficulty=difficulty,
                        count=int(count),
                        primary_provider=default_provider,
                    )

                # Reset state with a fresh session ID to prevent widget key collisions
                st.session_state.exam_session_id += 1
                st.session_state.exam_questions = questions
                st.session_state.exam_meta = {
                    "topic": final_topic,
                    "difficulty": difficulty,
                    "count": len(questions),
                    "provider": active_prov,
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                }
                st.session_state.user_answers = {i: None for i in range(len(questions))}
                st.session_state.exam_start_time = time.time()
                st.session_state.eval_results = None
                st.session_state.test_stage = "TAKING"
                st.rerun()

            except Exception as error:
                st.error(f"Examination Generation Failed: {error}")

# --------------------------------------------------
# 7. Screen 2: Interactive Exam Interface (Zero-Bug Option Selection)
# --------------------------------------------------

def render_taking_view():
    """Render the live examination interface with quick navigation and robust option inputs."""
    meta = st.session_state.exam_meta
    questions = st.session_state.exam_questions
    session_id = st.session_state.exam_session_id
    total = len(questions)

    # Top Compact Header Bar
    top_c1, top_c2 = st.columns([3, 1])
    with top_c1:
        st.markdown(
            f"""
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
                <h3 style="margin: 0; font-size: 1.25rem;">📝 {meta['topic']}</h3>
                <span class="badge badge-accent">{meta['difficulty']}</span>
                <span style="color: var(--text-muted); font-size: 0.85rem;">({total} Questions)</span>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with top_c2:
        if st.button("✕ Quit Test", type="secondary", use_container_width=True, help="Discard current exam and return to setup"):
            st.session_state.test_stage = "SETUP"
            st.rerun()

    # Progress & Completion Metrics
    answered_count = sum(1 for ans in st.session_state.user_answers.values() if ans is not None)
    pct_complete = (answered_count / total) if total > 0 else 0.0

    st.markdown("<div style='margin-top: 6px;'></div>", unsafe_allow_html=True)
    st.progress(pct_complete, text=f"Progress: {answered_count} of {total} answered ({int(pct_complete * 100)}%)")

    # Interactive Question Navigator Quick Strip (Compact)
    nav_chips_html = []
    for i in range(total):
        ans = st.session_state.user_answers.get(i)
        if ans:
            nav_chips_html.append(f"<span class='q-nav-chip q-nav-done'>Q{i+1}: {ans} ✓</span>")
        else:
            nav_chips_html.append(f"<span class='q-nav-chip q-nav-pending'>Q{i+1}: ⏳</span>")

    st.markdown(
        f"""
        <div style="background: rgba(17, 26, 46, 0.7); border: 1px solid var(--border-soft); border-radius: 10px; padding: 6px 10px; margin: 8px 0;">
            <div style="display: flex; flex-wrap: wrap; align-items: center;">
                <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin-right: 8px; letter-spacing: 0.5px;">Navigator:</span>
                {' '.join(nav_chips_html)}
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.divider()

    # Render Each Question Card
    for idx, q in enumerate(questions):
        saved_choice = st.session_state.user_answers.get(idx)
        options_dict = q["options"]
        letters = ["A", "B", "C", "D"]

        with st.container(border=True):
            # Question Card Header
            qc1, qc2 = st.columns([4, 1.5])
            with qc1:
                st.markdown(f"#### Q{idx + 1}. {q['question']}")
            with qc2:
                if saved_choice:
                    st.markdown(
                        f"<div style='text-align: right;'><span class='badge badge-success'>● Answered: Option {saved_choice}</span></div>",
                        unsafe_allow_html=True,
                    )
                else:
                    st.markdown(
                        "<div style='text-align: right;'><span class='badge badge-warn'>○ Pending</span></div>",
                        unsafe_allow_html=True,
                    )

            # Isolated widget key with session_id to guarantee zero stale state residue
            radio_key = f"q_radio_{session_id}_{idx}"
            selected_index = letters.index(saved_choice) if saved_choice in letters else None

            # Streamlit radio with format_func for 100% bug-free letter retrieval
            choice = st.radio(
                label=f"Options for Q{idx + 1}",
                options=letters,
                index=selected_index,
                format_func=lambda l: f"{l})  {options_dict[l]}",
                key=radio_key,
                label_visibility="collapsed",
            )

            # Synchronize state directly
            if choice != saved_choice:
                st.session_state.user_answers[idx] = choice

            # Clear button for this question
            if saved_choice is not None:
                clear_key = f"clear_{session_id}_{idx}"
                if st.button("✕ Clear Selection", key=clear_key, type="secondary"):
                    st.session_state.user_answers[idx] = None
                    # Clean the widget key from session state
                    if radio_key in st.session_state:
                        del st.session_state[radio_key]
                    st.rerun()

    st.divider()

    # --------------------------------------------------
    # Submission Bar & Confirmation Flow
    # --------------------------------------------------
    unanswered_count = total - answered_count

    if st.session_state.test_stage == "CONFIRM_SUBMIT":
        unanswered_indices = [f"Q{i+1}" for i, a in st.session_state.user_answers.items() if a is None]
        st.warning(
            f"⚠️ **Incomplete Submission:** You have **{unanswered_count} unanswered question(s)** ({', '.join(unanswered_indices)}). "
            "Are you sure you want to finish the examination? Unanswered questions will receive 0 marks."
        )

        c_col1, c_col2 = st.columns(2)
        with c_col1:
            if st.button("⚡ Confirm & Submit Anyway", type="primary", use_container_width=True):
                compute_evaluation_data()
                st.session_state.test_stage = "EVALUATED"
                st.rerun()

        with c_col2:
            if st.button("🔍 Return & Complete Questions", use_container_width=True):
                st.session_state.test_stage = "TAKING"
                st.rerun()

    else:
        sub_col1, sub_col2 = st.columns([2, 1])

        with sub_col1:
            submit_btn = st.button(
                "📤 Submit Examination for Evaluation",
                type="primary",
                use_container_width=True,
            )

        with sub_col2:
            if st.button("🔄 Reset All Choices", use_container_width=True, help="Clear all selected answers"):
                st.session_state.exam_session_id += 1
                st.session_state.user_answers = {i: None for i in range(total)}
                st.rerun()

        if submit_btn:
            if unanswered_count > 0:
                st.session_state.test_stage = "CONFIRM_SUBMIT"
                st.rerun()
            else:
                compute_evaluation_data()
                st.session_state.test_stage = "EVALUATED"
                st.rerun()

# --------------------------------------------------
# 8. Screen 3: Ultra-Premium Evaluation Screen
# --------------------------------------------------

def render_evaluation_view():
    """Render the evaluation screen showing right/wrong answers and deep concept explanations."""
    eval_data = st.session_state.eval_results
    meta = st.session_state.exam_meta

    if not eval_data:
        st.session_state.test_stage = "SETUP"
        st.rerun()
        return

    # Trigger celebration effect for high scores
    if eval_data["percentage"] >= 80:
        st.balloons()

    # Evaluation Hero Header (compact)
    hero(
        title="Examination Evaluation",
        subtitle=f"{meta.get('topic')} • {meta.get('difficulty')} • {meta.get('timestamp')}",
        badge="Results",
    )

    score = eval_data["score"]
    total = eval_data["total"]
    percentage = eval_data["percentage"]
    tier_title = eval_data["tier_title"]
    verdict = eval_data["verdict"]
    verdict_color = eval_data["verdict_color"]

    # Glassmorphic Glowing Score Compact Banner
    st.markdown(
        f"""
        <div class="eval-hero-banner">
            <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-muted); font-weight: 700; margin-bottom: 2px;">
                PERFORMANCE SCORECARD
            </div>
            <div style="font-size: 2.4rem; font-weight: 800; color: {verdict_color}; margin: 2px 0; font-family: var(--font-head); line-height: 1.1;">
                {score} <span style="font-size: 1.4rem; color: var(--text-muted); font-weight: 500;">/ {total}</span>
                <span style="font-size: 1.5rem; margin-left: 10px; font-weight: 700;">({percentage}%)</span>
            </div>
            <div style="display: inline-block; background: rgba(23, 34, 59, 0.85); border: 1px solid {verdict_color}; border-radius: 99px; padding: 3px 14px; margin: 4px 0; font-weight: 700; font-size: 0.82rem; color: #EEF2FF;">
                {tier_title}
            </div>
            <div style="color: #CCD3EC; font-size: 0.88rem; max-width: 580px; margin: 4px auto 0; line-height: 1.5;">
                {verdict}
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # 4-Column Diagnostic Analytics
    m1, m2, m3, m4 = st.columns(4)
    with m1:
        st.metric("Total Questions", f"{total}")
    with m2:
        st.metric("✅ Correct", f"{eval_data['correct_count']} ({int(eval_data['correct_count'] / total * 100)}%)")
    with m3:
        st.metric("❌ Incorrect", f"{eval_data['wrong_count']} ({int(eval_data['wrong_count'] / total * 100)}%)")
    with m4:
        st.metric("⏱️ Time Spent", f"{eval_data.get('time_taken')}", delta=f"avg {eval_data.get('pace')}")

    st.divider()

    # --------------------------------------------------
    # Detailed Question Breakdown with Highlighting
    # --------------------------------------------------
    st.subheader("📋 Comprehensive Question Analysis")

    tab_all, tab_wrong, tab_correct = st.tabs([
        f"All Questions ({total})",
        f"❌ Incorrect / Skipped ({eval_data['wrong_count'] + eval_data['skipped_count']})",
        f"✅ Correct ({eval_data['correct_count']})",
    ])

    def render_eval_option(letter: str, opt_text: str, is_correct: bool, is_user_pick: bool) -> str:
        """Format option card with compact visual styling."""
        if is_correct and is_user_pick:
            bg = "rgba(53, 224, 161, 0.16)"
            border = "1.5px solid #35E0A1"
            badge_html = "<span style='font-weight: 700; font-size: 0.80rem; color: #35E0A1; background: rgba(53,224,161,0.15); padding: 3px 8px; border-radius: 6px;'>✅ Your Choice (Correct)</span>"
        elif is_correct:
            bg = "rgba(53, 224, 161, 0.12)"
            border = "1.5px solid #35E0A1"
            badge_html = "<span style='font-weight: 700; font-size: 0.80rem; color: #35E0A1; background: rgba(53,224,161,0.15); padding: 3px 8px; border-radius: 6px;'>✓ Correct Answer</span>"
        elif is_user_pick:
            bg = "rgba(255, 107, 138, 0.16)"
            border = "1.5px solid #FF6B8A"
            badge_html = "<span style='font-weight: 700; font-size: 0.80rem; color: #FF6B8A; background: rgba(255,107,138,0.15); padding: 3px 8px; border-radius: 6px;'>✗ Your Choice (Wrong)</span>"
        else:
            bg = "#17223B"
            border = "1px solid #263250"
            badge_html = ""

        return (
            f"<div style='display: flex; justify-content: space-between; align-items: center; "
            f"background: {bg}; border: {border}; border-radius: 10px; padding: 9px 14px; margin: 6px 0; "
            f"color: #EEF2FF; font-size: 0.90rem;'>"
            f"<div><strong style='color: var(--accent); font-family: var(--font-head); margin-right: 6px;'>{letter})</strong> {opt_text}</div>"
            f"<div>{badge_html}</div>"
            f"</div>"
        )

    def render_question_cards(details_list: List[dict]):
        if not details_list:
            st.info("No questions in this filter view.")
            return

        for item in details_list:
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
                            "<div style='text-align: right;'><span class='badge badge-success'>✅ CORRECT (+1)</span></div>",
                            unsafe_allow_html=True,
                        )
                    elif status == "WRONG":
                        st.markdown(
                            "<div style='text-align: right;'><span class='badge badge-danger'>❌ INCORRECT (0)</span></div>",
                            unsafe_allow_html=True,
                        )
                    else:
                        st.markdown(
                            "<div style='text-align: right;'><span class='badge badge-warn'>⚠️ SKIPPED (0)</span></div>",
                            unsafe_allow_html=True,
                        )

                # Render Options
                for letter in ["A", "B", "C", "D"]:
                    opt_text = options.get(letter, "")
                    is_this_correct = (letter == correct_ans)
                    is_this_user_pick = (letter == user_ans)
                    st.markdown(
                        render_eval_option(letter, opt_text, is_this_correct, is_this_user_pick),
                        unsafe_allow_html=True,
                    )

                # Concept Rationale Deep Dive (Compact)
                st.markdown(
                    f"""
                    <div style="background: rgba(124, 131, 255, 0.08); border-left: 3px solid var(--accent); padding: 10px 14px; border-radius: 8px; margin-top: 10px;">
                        <div style="color: var(--accent); font-weight: 700; font-size: 0.88rem; margin-bottom: 3px;">
                            💡 Conceptual Rationale:
                        </div>
                        <div style="color: #CCD3EC; font-size: 0.89rem; line-height: 1.5;">
                            {item['explanation']}
                        </div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

    with tab_all:
        render_question_cards(eval_data["details"])

    with tab_wrong:
        wrong_items = [d for d in eval_data["details"] if not d["is_correct"]]
        render_question_cards(wrong_items)

    with tab_correct:
        correct_items = [d for d in eval_data["details"] if d["is_correct"]]
        render_question_cards(correct_items)

    st.divider()

    # --------------------------------------------------
    # Post-Evaluation Command Center
    # --------------------------------------------------
    st.subheader("🎯 Post-Assessment Actions")

    act_col1, act_col2, act_col3 = st.columns(3)

    with act_col1:
        if st.button("🔄 Retake This Examination", type="primary", use_container_width=True, help="Retest the same questions to achieve a 100% score"):
            # Clean widget session isolation
            st.session_state.exam_session_id += 1
            st.session_state.user_answers = {i: None for i in range(len(st.session_state.exam_questions))}
            st.session_state.exam_start_time = time.time()
            st.session_state.eval_results = None
            st.session_state.test_stage = "TAKING"
            st.rerun()

    with act_col2:
        if st.button("✨ Configure New Examination", use_container_width=True, help="Generate a new assessment on any subject"):
            st.session_state.exam_session_id += 1
            st.session_state.exam_questions = []
            st.session_state.user_answers = {}
            st.session_state.eval_results = None
            st.session_state.test_stage = "SETUP"
            st.rerun()

    with act_col3:
        report_md = export_report_markdown()
        file_name = f"Exam_Report_{meta.get('topic').replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        st.download_button(
            label="📥 Download Diagnostic Report",
            data=report_md,
            file_name=file_name,
            mime="text/markdown",
            use_container_width=True,
        )

# --------------------------------------------------
# 9. Master Router
# --------------------------------------------------

def main():
    stage = st.session_state.test_stage

    if stage in ["TAKING", "CONFIRM_SUBMIT"] and st.session_state.exam_questions:
        render_taking_view()
    elif stage == "EVALUATED" and st.session_state.eval_results:
        render_evaluation_view()
    else:
        render_setup_view()


if __name__ == "__main__":
    main()

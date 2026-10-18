import os
import streamlit as st

try:
    st.set_page_config(
        page_title="AI Examination Platform",
        page_icon="🎓",
        layout="centered",
    )
except Exception:
    pass

try:
    from styles import load_styles
except ImportError:
    from milestone1.styles import load_styles

load_styles()

st.sidebar.title("AI Examination Suite")
st.sidebar.caption("Milestone 1 Deliverables")

selected_task = st.sidebar.radio(
    "Navigate Tasks:",
    [
        "Task 5: Multimodal Exam (Handwritten Image OCR + AI Evaluation)",
        "Task 4: Interactive Descriptive Q&A Examination & Evaluation",
        "Task 3: Interactive Exam & Evaluation Screen",
        "Task 2: AI MCQ Generator",
        "Task 1: Multi-Model LLM Integration",
    ],
    index=0,
)

if selected_task == "Task 5: Multimodal Exam (Handwritten Image OCR + AI Evaluation)":
    try:
        from task5 import main as task5_main
    except ImportError:
        from milestone1.task5 import main as task5_main
    task5_main()

elif selected_task == "Task 4: Interactive Descriptive Q&A Examination & Evaluation":
    try:
        from task4 import main as task4_main
    except ImportError:
        from milestone1.task4 import main as task4_main
    task4_main()

elif selected_task == "Task 3: Interactive Exam & Evaluation Screen":
    try:
        from task3 import main as task3_main
    except ImportError:
        from milestone1.task3 import main as task3_main
    task3_main()

elif selected_task == "Task 2: AI MCQ Generator":
    st.subheader("📝 Task 2: AI MCQ Generator")
    st.write("Generates multiple-choice questions dynamically from topics and difficulty levels.")
    st.info("💡 Run standalone: `streamlit run milestone1/task2.py`")
    st.markdown(
        "> **Note:** Task 3 is an interactive extension of Task 2 that includes option selection, "
        "submission, scoring, and full diagnostic evaluation of right and wrong answers."
    )

elif selected_task == "Task 1: Multi-Model LLM Integration":
    st.subheader("🤖 Task 1: Multi-Model LLM Integration")
    st.write("Direct integration and benchmarking of OpenAI ChatGPT and Google Gemini Flash.")
    st.info("💡 Run standalone: `python milestone1/task1.py`")
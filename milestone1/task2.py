
import json
import os
import re

import streamlit as st
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage
# --------------------------------------------------
# 1. Configuration
# --------------------------------------------------

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(ROOT_DIR, ".env"), override=True)

st.set_page_config(
    page_title="AI MCQ Generator",
    page_icon="📝",
    layout="centered",
)

# --------------------------------------------------
# 2. UI Styling
# --------------------------------------------------

try:
    from styles import load_styles
except ImportError:
    from milestone1.styles import load_styles

load_styles()

# --------------------------------------------------
# 3. Page Heading
# --------------------------------------------------

st.title("AI MCQ Generator")
st.write("Generate topic-wise multiple-choice questions using AI.")

# --------------------------------------------------
# 4. User Inputs
# --------------------------------------------------

with st.container(border=True):
    col1, col2, col3 = st.columns(3)

    with col1:
        topic = st.selectbox(
            "Topic",
            [
                "SQL",
                "Python",
                "Java",
                "C++",
                "DSA",
                "DBMS",
                "Operating Systems",
                "Computer Networks",
                "OOP",
                "Machine Learning",
                "Other",
            ],
        )

    with col2:
        difficulty = st.selectbox(
            "Difficulty",
            ["Easy", "Medium", "Hard"],
        )

    with col3:
        count = st.number_input(
            "Questions",
            min_value=1,
            max_value=25,
            value=10,
            step=1,
        )

    custom_topic = st.text_input(
        "Custom topic (used when Topic is 'Other')",
        placeholder="e.g. Generative AI, React Hooks",
    )

    generate = st.button(
        "Generate MCQs",
        type="primary",
        use_container_width=True,
    )

# --------------------------------------------------
# 5. Initialize AI Model (Background Configuration)
# --------------------------------------------------

def get_default_provider() -> str:
    """Resolve the AI model provider in the background from .env or available API keys."""
    env_provider = os.getenv("AI_PROVIDER", "").strip().lower()
    if "openai" in env_provider or "chatgpt" in env_provider:
        return "OpenAI (ChatGPT)"
    if "google" in env_provider or "gemini" in env_provider:
        return "Google (Gemini Flash)"

    # Automatically select based on available API key
    if os.getenv("GOOGLE_API_KEY"):
        return "Google (Gemini Flash)"
    if os.getenv("OPENAI_API_KEY"):
        return "OpenAI (ChatGPT)"

    return "Google (Gemini Flash)"


def get_llm(provider_name: str = None):
    """Initialize the LangChain chat model in the background."""

    if not provider_name:
        provider_name = get_default_provider()

    if provider_name == "OpenAI (ChatGPT)":
        api_key = os.getenv("OPENAI_API_KEY")

        if not api_key:
            raise ValueError(
                "OPENAI_API_KEY is missing from the root .env file."
            )

        return ChatOpenAI(
            model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
            api_key=api_key,
            temperature=0,
        )

    api_key = os.getenv("GOOGLE_API_KEY")

    if not api_key:
        raise ValueError(
            "GOOGLE_API_KEY is missing from the root .env file."
        )

    return ChatGoogleGenerativeAI(
        model=os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite"),
        google_api_key=api_key,
        temperature=0,
    )

# --------------------------------------------------
# 6. Parse and Validate JSON
# --------------------------------------------------

def extract_json(text: str) -> dict:
    """Extract JSON from the model response."""

    text = text.strip()

    # Remove optional Markdown code fences
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)

    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end == -1:
        raise ValueError("The AI response does not contain valid JSON.")

    try:
        return json.loads(text[start:end + 1])
    except json.JSONDecodeError as error:
        raise ValueError(
            f"The AI returned invalid JSON: {error}"
        ) from error


def validate_questions(data: dict, total: int) -> list:
    """Validate generated MCQs before displaying them."""

    questions = data.get("questions")

    if not isinstance(questions, list):
        raise ValueError("The response does not contain a questions list.")

    # Allow slight flexibility if total count is close, but slice or warn
    if len(questions) > total:
        questions = questions[:total]
    elif len(questions) != total:
        raise ValueError(
            f"Expected {total} questions, but received {len(questions)}."
        )

    required_options = ["A", "B", "C", "D"]

    for index, question in enumerate(questions, start=1):
        if not isinstance(question, dict):
            raise ValueError(f"Question {index} has an invalid format.")

        if not isinstance(question.get("question"), str):
            raise ValueError(f"Question {index} is missing its text.")

        options = question.get("options")
        # Handle options provided as list: ["opt1", "opt2", "opt3", "opt4"]
        if isinstance(options, list) and len(options) >= 4:
            options = {required_options[i]: str(opt) for i, opt in enumerate(options[:4])}
            question["options"] = options

        if not isinstance(options, dict):
            raise ValueError(f"Question {index} has invalid options.")

        for letter in required_options:
            if letter not in options or not isinstance(options[letter], str):
                raise ValueError(
                    f"Question {index} is missing option {letter}."
                )

        answer = question.get("answer") or question.get("correct_answer") or question.get("correct")
        if isinstance(answer, str):
            answer = answer.strip().upper()
            # If answer is 'OPTION A' or 'A)'
            match = re.search(r"\b([A-D])\b", answer)
            if match:
                answer = match.group(1)
            else:
                # Check if answer matches option text
                for letter in required_options:
                    if answer.lower() == options[letter].strip().lower():
                        answer = letter
                        break

        question["answer"] = answer

        if answer not in required_options:
            raise ValueError(
                f"Question {index} has an invalid correct answer."
            )

        question.setdefault("explanation", "No explanation provided.")

    return questions

# --------------------------------------------------
# 7. Generate MCQs with LangChain
# --------------------------------------------------

def generate_mcqs(
    selected_topic: str,
    level: str,
    total: int,
    provider_name: str = None,
) -> list:
    """Generate multiple-choice questions using the AI model in the background."""

    # IMPORTANT:
    # Use a plain string for the system prompt instead of a
    # template string, so JSON braces are not interpreted as
    # LangChain template variables.

    system_prompt = """
You are an expert examination question generator.

Create accurate, educational multiple-choice questions.

Return ONLY a valid JSON object with this structure:
{
  "questions": [
    {
      "question": "Question text",
      "options": {
        "A": "Option A",
        "B": "Option B",
        "C": "Option C",
        "D": "Option D"
      },
      "answer": "A",
      "explanation": "Brief explanation"
    }
  ]
}

Rules:
- Generate exactly the requested number of questions.
- Every question must have exactly four options: A, B, C and D.
- The answer must be the letter A, B, C or D.
- Make sure the answer matches the correct option.
- Avoid duplicate questions.
- Match the requested difficulty.
- Keep questions clear and educational.
- Do not include Markdown fences or text outside the JSON.
"""

    
    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessage(content=system_prompt),
            (
                "human",
                "Topic: {topic}\n"
                "Difficulty: {difficulty}\n"
                "Number of questions: {count}\n"
                "Generate the MCQs now.",
            ),
        ]
    )

    llm = get_llm(provider_name)
    chain = prompt | llm

    response = chain.invoke(
        {
            "topic": selected_topic,
            "difficulty": level,
            "count": total,
        }
    )
    content = response.content
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict) and "text" in item:
                parts.append(str(item["text"]))
            elif isinstance(item, str):
                parts.append(item)
            elif hasattr(item, "text"):
                parts.append(str(item.text))
            else:
                parts.append(str(item))
        content = "".join(parts)
    elif not isinstance(content, str):
        content = str(content)

    data = extract_json(content)

    return validate_questions(data, total)

# --------------------------------------------------
# 8. Generate Button Logic
# --------------------------------------------------

if generate:
    final_topic = (
        custom_topic.strip()
        if topic == "Other"
        else topic
    )

    if not final_topic:
        st.warning("Please enter a custom topic.")
    else:
        try:
            with st.spinner("Generating MCQs... Please wait."):
                provider_name = get_default_provider()
                questions = generate_mcqs(
                    selected_topic=final_topic,
                    level=difficulty,
                    total=int(count),
                    provider_name=provider_name,
                )

            st.session_state["mcqs"] = questions
            st.session_state["mcq_topic"] = final_topic
            st.session_state["mcq_difficulty"] = difficulty
            st.session_state["mcq_provider"] = provider_name

        except Exception as error:
            st.error(f"Could not generate MCQs: {error}")

# --------------------------------------------------
# 9. Display Questions and Answers
# --------------------------------------------------

if "mcqs" in st.session_state:
    questions = st.session_state["mcqs"]

    st.success(
        f"{len(questions)} "
        f"{st.session_state['mcq_difficulty']} "
        f"{st.session_state['mcq_topic']} questions generated successfully."
    )

    show_answers = st.checkbox("Show answers")

    for index, question in enumerate(questions, start=1):
        st.markdown(
            f"### Q{index}. {question['question']}"
        )

        options = question["options"]
        answer = question["answer"]

        for letter in ["A", "B", "C", "D"]:
            st.markdown(f"**{letter})** {options[letter]}")

        if show_answers:
            st.success(
                f"Correct Answer: {answer}) {options[answer]}"
            )

            st.info(question["explanation"])

        st.divider()

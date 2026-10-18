"""
AI-Based Intelligent Examination Platform
Milestone 1 - Task 1: LLM Integration (OpenAI & Google Gemini)
"""

import os
from typing import Any, Optional
from dotenv import find_dotenv, load_dotenv
from openai import OpenAI
from google import genai
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

# Load environment variables
load_dotenv(find_dotenv(usecwd=True) or None, override=True)

# Configurable model names via environment variables with sensible defaults
DEFAULT_OPENAI_MODEL = "gpt-4o-mini"
DEFAULT_GEMINI_MODEL = "gemini-3.8-flash"

OPENAI_MODEL = os.getenv("OPENAI_MODEL", DEFAULT_OPENAI_MODEL)
GEMINI_MODEL = os.getenv("GEMINI_MODEL", DEFAULT_GEMINI_MODEL)

DEFAULT_PROMPT = """
You are an intelligent AI assistant.

Explain how AI can help conduct online examinations.
Include:
1. Automated proctoring
2. Cheating detection
3. Student performance analysis
4. Benefits and limitations
"""


def validate_api_key(name: str) -> Optional[str]:
    """
    Validate that an API key is set and not a placeholder.
    Returns the key if valid, or None if missing/invalid without leaking its value.
    """
    value = os.getenv(name, "").strip().strip('"').strip("'")
    placeholders = {
        "",
        "your_openai_api_key",
        "your_google_api_key",
        "placeholder",
    }
    if not value or value.lower() in placeholders:
        return None
    return value


def list_openai_models(api_key: str) -> list[str]:
    """List available OpenAI models for the authenticated account."""
    client = OpenAI(api_key=api_key)
    response = client.models.list()
    models = sorted([model.id for model in response.data])
    return models


def list_gemini_flash_models(api_key: str) -> list[str]:
    """List available Gemini Flash models."""
    client = genai.Client(api_key=api_key)
    flash_models: list[str] = []
    for model in client.models.list():
        name = getattr(model, "name", "") or str(model)
        if "flash" in name.lower():
            flash_models.append(name)
    return sorted(flash_models)


def _extract_response_text(response: Any) -> str:
    """Safely extract plain text from a LangChain LLM response."""
    if hasattr(response, "text") and response.text:
        return str(response.text)

    content = getattr(response, "content", response)
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, dict) and "text" in item:
                parts.append(str(item["text"]))
            elif isinstance(item, str):
                parts.append(item)
            else:
                parts.append(str(item))
        return "".join(parts)

    return str(content)


def ask_openai(prompt_text: str, api_key: str, model_name: str = OPENAI_MODEL) -> str:
    """Send prompt to OpenAI via LangChain ChatOpenAI."""
    llm = ChatOpenAI(
        model=model_name,
        api_key=api_key,
        temperature=0.3,
    )
    response = llm.invoke(prompt_text)
    return _extract_response_text(response)


def ask_gemini(prompt_text: str, api_key: str, model_name: str = GEMINI_MODEL) -> str:
    """Send prompt to Google Gemini via LangChain ChatGoogleGenerativeAI."""
    llm = ChatGoogleGenerativeAI(
        model=model_name,
        google_api_key=api_key,
        temperature=0.3,
    )
    response = llm.invoke(prompt_text)
    return _extract_response_text(response)


def main():
    print("=" * 60)
    print(" AI-Based Intelligent Examination Platform")
    print(" Milestone 1: Multi-Model Evaluation (OpenAI & Gemini)")
    print("=" * 60)

    openai_key = validate_api_key("OPENAI_API_KEY")
    gemini_key = validate_api_key("GOOGLE_API_KEY")

    if not openai_key:
        print("[WARNING] OPENAI_API_KEY is not configured or contains placeholder text.")
    else:
        print("[OK] OPENAI_API_KEY is configured.")

    if not gemini_key:
        print("[WARNING] GOOGLE_API_KEY is not configured or contains placeholder text.")
    else:
        print("[OK] GOOGLE_API_KEY is configured.")

    # 1. Listing OpenAI Models
    print("\n" + "=" * 30 + " OPENAI MODELS " + "=" * 30)
    if openai_key:
        try:
            models = list_openai_models(openai_key)
            print(f"Found {len(models)} accessible OpenAI models. Sample models:")
            for m in models[:10]:
                print(f" - {m}")
            if len(models) > 10:
                print(f" ... and {len(models) - 10} more.")
        except Exception as error:
            print(f"OpenAI model listing failed: {error}")
    else:
        print("Skipped: OPENAI_API_KEY is not set.")

    # 2. Listing Gemini Flash Models
    print("\n" + "=" * 30 + " GEMINI FLASH MODELS " + "=" * 30)
    if gemini_key:
        try:
            flash_models = list_gemini_flash_models(gemini_key)
            print(f"Found {len(flash_models)} Gemini Flash models:")
            for m in flash_models:
                print(f" - {m}")
        except Exception as error:
            print(f"Gemini model listing failed: {error}")
    else:
        print("Skipped: GOOGLE_API_KEY is not set.")

    # 3. Prompt Template
    prompt_template = ChatPromptTemplate.from_template("{question}")
    formatted_prompt = prompt_template.invoke({"question": DEFAULT_PROMPT})
    prompt_text = formatted_prompt.to_string()

    # 4. OpenAI Response
    print("\n" + "=" * 30 + " OPENAI RESPONSE " + "=" * 30)
    if openai_key:
        try:
            print(f"Querying OpenAI model ({OPENAI_MODEL})...\n")
            openai_result = ask_openai(prompt_text, openai_key)
            print(openai_result)
        except Exception as error:
            print(f"OpenAI request failed: {error}")
    else:
        print("Skipped: OPENAI_API_KEY is not configured.")

    # 5. Gemini Response
    print("\n" + "=" * 30 + " GEMINI RESPONSE " + "=" * 30)
    if gemini_key:
        try:
            print(f"Querying Gemini model ({GEMINI_MODEL})...\n")
            gemini_result = ask_gemini(prompt_text, gemini_key)
            print(gemini_result)
        except Exception as error:
            print(f"Gemini request failed: {error}")
    else:
        print("Skipped: GOOGLE_API_KEY is not configured.")

    print("\n" + "=" * 60)
    print(" Execution Completed")
    print("=" * 60)


if __name__ == "__main__":
    main()
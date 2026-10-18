import streamlit as st

CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');

/* ---------- Professional Enterprise Design Tokens ---------- */
:root {
    --bg:           #0B0F19;
    --surface:      #111827;
    --surface-2:    #162032;
    --border:       #233048;
    --border-soft:  #1B2538;
    --text:         #F8FAFC;
    --text-muted:   #94A3B8;
    --accent:       #6366F1;
    --accent-hover: #4F46E5;
    --accent-soft:  rgba(99, 102, 241, 0.12);
    --success:      #10B981;
    --success-soft: rgba(16, 185, 129, 0.10);
    --danger:       #EF4444;
    --danger-soft:  rgba(239, 68, 68, 0.10);
    --warn:         #F59E0B;
    --radius-lg:    12px;
    --radius-md:    8px;
    --font-body:    'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
    --font-head:    'Space Grotesk', 'Plus Jakarta Sans', system-ui, sans-serif;
}

/* ---------- App Shell ---------- */
html, body, .stApp, [class*="st-"] { 
    font-family: var(--font-body); 
}
[data-testid="stIconMaterial"], [class*="material-symbols-"], .material-icons {
    font-family: 'Material Symbols Rounded', 'Material Icons', sans-serif !important;
}

.stApp {
    background: var(--bg);
    color: var(--text);
}
header[data-testid="stHeader"] { background: transparent; }
#MainMenu, footer { visibility: hidden; }

.block-container {
    max-width: 920px;
    padding-top: 1.5rem;
    padding-bottom: 2.5rem;
}

/* ---------- Typography ---------- */
h1, h2, h3, h4 {
    font-family: var(--font-head) !important;
    color: var(--text);
    letter-spacing: -0.3px;
}
h1 {
    font-size: 1.75rem !important;
    font-weight: 700 !important;
    margin-bottom: 0.25rem !important;
}
h2 { font-size: 1.30rem !important; font-weight: 600 !important; }
h3 { font-size: 1.10rem !important; font-weight: 600 !important; }
h4 { font-size: 0.98rem !important; font-weight: 600 !important; }
p, li, label, .stMarkdown { color: #CBD5E1; line-height: 1.55; font-size: 0.90rem; }
small, [data-testid="stCaptionContainer"] { color: var(--text-muted); font-size: 0.82rem; }

/* ---------- Containers & Cards ---------- */
[data-testid="stVerticalBlockBorderWrapper"] {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: none;
    transition: border-color .2s ease;
}
[data-testid="stVerticalBlockBorderWrapper"]:hover {
    border-color: #2F3E58;
}

/* ---------- Form Controls & Inputs ---------- */
div[data-baseweb="select"] > div,
div[data-baseweb="input"] > div,
div[data-baseweb="textarea"] > div,
div[data-baseweb="base-input"] {
    background: var(--surface-2) !important;
    border: 1px solid var(--border) !important;
    border-radius: 6px !important;
    color: var(--text);
    min-height: 38px !important;
    font-size: 0.90rem;
    transition: border-color .2s ease;
}
div[data-baseweb="select"] > div:focus-within,
div[data-baseweb="input"] > div:focus-within,
div[data-baseweb="textarea"] > div:focus-within {
    border-color: var(--accent) !important;
    box-shadow: 0 0 0 2px var(--accent-soft);
}
input::placeholder, textarea::placeholder { color: #64748B; font-size: 0.86rem; }

/* ---------- Code Blocks & Syntax ---------- */
code, kbd, samp, pre {
    font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace !important;
}
code:not(pre code) {
    background: #162032 !important;
    color: #93C5FD !important;
    padding: 2px 6px !important;
    border-radius: 4px !important;
    border: 1px solid var(--border-soft) !important;
    font-size: 0.84em !important;
}
pre, pre.stCode, .stCode, div[data-testid="stCode"], div[data-testid="stCodeBlock"], .stMarkdown pre {
    background: #090E17 !important;
    background-color: #090E17 !important;
    border: 1px solid var(--border) !important;
    border-radius: 8px !important;
    padding: 10px 14px !important;
    color: #E2E8F0 !important;
}
pre code, pre.stCode code, .stCode code, div[data-testid="stCode"] code, div[data-testid="stCodeBlock"] code {
    background: transparent !important;
    background-color: transparent !important;
    color: #E2E8F0 !important;
    border: none !important;
    padding: 0 !important;
    font-size: 0.86rem !important;
}

/* ---------- Buttons ---------- */
div.stButton > button,
div.stDownloadButton > button,
div.stFormSubmitButton > button {
    border-radius: 6px;
    min-height: 36px;
    padding: 6px 14px;
    font-size: 0.88rem;
    font-weight: 600;
    transition: background .2s ease, border-color .2s ease, color .2s ease;
    box-shadow: none !important;
}

/* Primary Button */
div.stButton > button[kind="primary"],
div.stFormSubmitButton > button[kind="primary"] {
    background: var(--accent);
    color: #FFFFFF;
    border: 1px solid var(--accent);
}
div.stButton > button[kind="primary"]:hover,
div.stFormSubmitButton > button[kind="primary"]:hover {
    background: var(--accent-hover);
    border-color: var(--accent-hover);
    color: #FFFFFF;
}

/* Secondary Button */
div.stButton > button[kind="secondary"],
div.stDownloadButton > button {
    background: var(--surface-2);
    color: var(--text);
    border: 1px solid var(--border);
}
div.stButton > button[kind="secondary"]:hover,
div.stDownloadButton > button:hover {
    border-color: #3B4B68;
    background: #1C273E;
    color: #FFFFFF;
}

/* ---------- Options (Radio / Checkbox) ---------- */
div[data-testid="stCheckbox"],
div[role="radiogroup"] > label {
    background: var(--surface-2);
    border: 1px solid var(--border-soft);
    border-radius: 6px;
    padding: 8px 12px;
    margin-bottom: 5px;
    font-size: 0.88rem;
    transition: border-color .15s ease, background .15s ease;
}
div[data-testid="stCheckbox"]:hover,
div[role="radiogroup"] > label:hover {
    border-color: #33435F;
    background: #1A2438;
}
div[role="radiogroup"] > label:has(input:checked),
div[data-testid="stCheckbox"]:has(input:checked) {
    border-color: var(--accent);
    background: var(--accent-soft);
}

/* ---------- Tabs ---------- */
button[role="tab"] { color: var(--text-muted); font-weight: 600; font-size: 0.86rem; }
button[role="tab"]:hover { color: var(--text); }
button[role="tab"][aria-selected="true"] { color: var(--text); }
div[data-baseweb="tab-highlight"] {
    background: var(--accent) !important;
}
div[data-baseweb="tab-border"] { background: var(--border) !important; }

/* ---------- Progress ---------- */
div[data-testid="stProgress"] > div > div { background: var(--surface-2); border-radius: 4px; }
div[data-testid="stProgress"] > div > div > div {
    background-color: var(--accent);
    border-radius: 4px;
}

/* ---------- Metrics & Expanders ---------- */
div[data-testid="stMetric"] {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 14px;
}
div[data-testid="stMetricLabel"] { color: var(--text-muted); font-size: 0.78rem !important; }
div[data-testid="stMetricValue"] { font-family: var(--font-head); font-weight: 700; font-size: 1.35rem !important; }

details[data-testid="stExpander"] {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
}

div[data-testid="stAlert"] { border-radius: 8px; }

/* ---------- Badges & Utilities ---------- */
.badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 4px;
    font-size: 0.78rem;
    font-weight: 600;
    background: var(--surface-2);
    color: var(--text-muted);
    border: 1px solid var(--border);
}
.badge-accent {
    background: var(--accent-soft) !important;
    color: var(--accent) !important;
    border: 1px solid rgba(99, 102, 241, 0.3) !important;
}
.badge-success {
    background: var(--success-soft) !important;
    color: var(--success) !important;
    border: 1px solid rgba(16, 185, 129, 0.3) !important;
}
.badge-danger {
    background: var(--danger-soft) !important;
    color: var(--danger) !important;
    border: 1px solid rgba(239, 68, 68, 0.3) !important;
}
.badge-warn {
    background: rgba(245, 158, 11, 0.10) !important;
    color: var(--warn) !important;
    border: 1px solid rgba(245, 158, 11, 0.3) !important;
}

/* ---------- Clean Assessment Components ---------- */
.eval-hero-banner {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 20px;
    margin-bottom: 16px;
    text-align: center;
}

.timer-live-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 0.82rem;
    font-weight: 600;
    color: #F87171;
}

.q-nav-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px 10px;
    border-radius: 5px;
    font-size: 0.80rem;
    font-weight: 600;
    margin: 2px 4px 2px 0;
}
.q-nav-done {
    background: var(--success-soft);
    color: var(--success);
    border: 1px solid rgba(16, 185, 129, 0.25);
}
.q-nav-pending {
    background: var(--surface-2);
    color: var(--text-muted);
    border: 1px solid var(--border-soft);
}

/* Side-by-side OCR Extracted Portion */
.image-ocr-portion {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 14px;
    margin: 6px 0;
}
.ocr-text-box {
    background: #090E17;
    border: 1px solid var(--border-soft);
    border-radius: 6px;
    padding: 10px 12px;
    margin-top: 6px;
    color: var(--text);
    font-size: 0.88rem;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: var(--font-body);
}
.ocr-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    background: var(--surface);
    color: var(--text-muted);
    border: 1px solid var(--border);
}
.ocr-badge-success {
    background: var(--success-soft);
    color: var(--success);
    border-color: rgba(16, 185, 129, 0.3);
}

/* Dimension Cards */
.dim-card {
    background: var(--surface-2);
    border: 1px solid var(--border-soft);
    border-radius: 6px;
    padding: 8px 12px;
}

/* Concept Checklist */
.concept-tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    border-radius: 5px;
    padding: 3px 8px;
    font-size: 0.78rem;
    font-weight: 600;
    margin: 2px;
}
.concept-covered {
    background: var(--success-soft);
    color: var(--success);
    border: 1px solid rgba(16, 185, 129, 0.25);
}
.concept-partial {
    background: rgba(245, 158, 11, 0.10);
    color: var(--warn);
    border: 1px solid rgba(245, 158, 11, 0.25);
}
.concept-missed {
    background: var(--danger-soft);
    color: var(--danger);
    border: 1px solid rgba(239, 68, 68, 0.25);
}

/* AI Model Rewrite Card */
.rewrite-card {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-left: 3px solid var(--accent);
    border-radius: 6px;
    padding: 12px 14px;
    margin: 10px 0;
}

.hero { margin-bottom: 14px; }
.hero p { font-size: 0.88rem; color: var(--text-muted); max-width: 65ch; margin-top: 2px; margin-bottom: 4px; }

/* ---------- Sidebar ---------- */
section[data-testid="stSidebar"] {
    background: #080D16;
    border-right: 1px solid var(--border-soft);
}

hr { border-color: var(--border-soft); }
::selection { background: var(--accent); color: #FFFFFF; }
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb { background: #233048; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #324364; }

@media (max-width: 640px) {
    .block-container { padding: 1rem 0.8rem 2rem; }
    h1 { font-size: 1.5rem !important; }
    div.stButton > button { width: 100%; }
}
</style>
"""


def load_styles() -> None:
    """Inject the global stylesheet. Call once, right after st.set_page_config()."""
    st.markdown(CSS, unsafe_allow_html=True)


def hero(title: str, subtitle: str = "", badge: str = "") -> None:
    """Page header with optional badge and subtitle."""
    badge_html = f'<span class="badge" style="margin-bottom: 6px;">{badge}</span><br>' if badge else ""
    sub_html = f"<p>{subtitle}</p>" if subtitle else ""
    st.markdown(
        f'<div class="hero">{badge_html}<h1>{title}</h1>{sub_html}</div>',
        unsafe_allow_html=True,
    )


def result_box(correct: bool, message: str) -> None:
    """Feedback box for task verification."""
    cls = "badge-success" if correct else "badge-danger"
    st.markdown(f'<div class="badge {cls}" style="display:block; padding:10px 14px; margin:8px 0;">{message}</div>', unsafe_allow_html=True)
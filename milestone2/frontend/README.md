# ExamAI — Frontend Authentication Module (Milestone 2)

> **"The intelligent way to run online examinations"**  
> Enterprise-grade online examination platform featuring automated MediaPipe webcam proctoring, Google Gemini AI question generation, handwriting OCR analysis, and server-verified assessment scoring.

---

## 1. Tech Stack & Design System

- **Framework**: React 19 + Vite
- **Routing**: React Router v6
- **Styling**: Plain CSS with CSS Variables (`variables.css` & `global.css`)
- **Typography**: Playfair Display (headings) & Inter (body and forms)
- **Palette**: Strictly adheres to the institutional design system (no gold/yellow):
  - Base: Midnight Navy (`#0B1B33`), Page Bg (`#F7F9FC`), Surface (`#FFFFFF`), Border (`#E1E6EE`)
  - Role Accents:
    - **Student**: Sapphire (`#2D5BD0`), Badge (`bg: #E6EDFB, text: #2347A8, border: #BFD0F3`)
    - **Teacher**: Forest Jade (`#0E6B58`), Badge (`bg: #E3F1EC, text: #0E6B58, border: #B7DACD`)
    - **Admin**: Slate Graphite (`#22262E`), Badge (`bg: #E9EAEC, text: #22262E, border: #CDD0D5`)
    - **AI Badge**: Midnight (`bg: #0B1B33, text: #9DB6F5, border: #23375C`)

---

## 2. Project Structure

```
milestone2/frontend/
├── index.html                  # HTML entry with Google Fonts (Playfair Display & Inter)
├── vite.config.js              # Configured for localhost:3000
├── package.json                # Dependencies (React 19, React Router v6, Vite, Oxlint)
├── public/
│   └── favicon.svg             # Custom geometric ExamAI brand icon
└── src/
    ├── App.jsx                 # Route definitions and navigation guards
    ├── main.jsx                # Application mounting point
    ├── index.css               # Imports design tokens & global CSS resets
    ├── styles/
    │   ├── variables.css       # Strict palette, role accents, typography & shadows
    │   └── global.css          # Responsive container, animations, accessible focus
    ├── components/
    │   ├── Navbar.jsx          # Brand and direct links (Student, Teacher, Admin login)
    │   ├── Footer.jsx          # Institutional footer with platform status
    │   ├── Button.jsx          # Role-colored button with loading spinner & micro-press
    │   ├── Input.jsx           # Accessible input with role focus rings & error messages
    │   ├── PasswordInput.jsx   # Controlled password field with accessible show/hide toggle
    │   ├── PasswordStrength.jsx# Live password strength meter & criteria checklist
    │   ├── Badge.jsx           # Small pill badge for roles and AI status
    │   ├── AuthLayout.jsx      # Split layout (45% navy panel + 55% white form card)
    │   └── FeatureCard.jsx     # Landing feature cards with custom geometry
    ├── pages/
    │   ├── Landing.jsx         # Hero, 4 feature cards, "Fair by design" architecture
    │   ├── Login.jsx           # Reusable login driven by role prop
    │   ├── Signup.jsx          # Student & Teacher registration with exact fields
    │   ├── Dashboard.jsx       # Post-login role placeholder with session telemetry
    │   └── NotFound.jsx        # 404 page with return to home
    └── utils/
        ├── validators.js       # Field validation, regex rules & strength calculator
        └── mockApi.js          # Simulated API calls (1.2s delay, session persistence)
```

---

## 3. Setup and Run Instructions

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation & Launch
```bash
# Navigate to the frontend directory
cd milestone2/frontend

# Install dependencies
npm install

# Start Vite development server on port 3000
npm run dev
```

Open your browser at:
```
http://localhost:3000
```

To run a production build:
```bash
npm run build
```

---

## 4. Routes and Navigation

| Route | Role / Purpose | Notes |
|---|---|---|
| `/` | Landing Page | Tagline, hero CTA buttons, 4 feature cards, "Fair by design" section, footer |
| `/login/student` | Student Login | Sapphire theme, email & password, show/hide toggle, link to signup |
| `/login/teacher` | Teacher Login | Sage green theme, email & password, show/hide toggle, link to signup |
| `/login/admin` | Admin Login | Slate theme, email & password, show/hide toggle (No signup link) |
| `/signup/student` | Student Signup | First/last name side-by-side, email, institute, roll number, class/year, password strength |
| `/signup/teacher` | Teacher Signup | First/last name side-by-side, email, department, password strength |
| `/signup/admin` | Redirect Guard | Automatically redirects to `/login/admin` (Admin has no signup) |
| `/dashboard/:role` | Post-Login Workspace | Simulated session details and milestone completion status |
| `*` | 404 Not Found | Friendly 404 with link to return home |

---

## 5. Backend API Integration Guide

All authentication calls are centralized in [`src/utils/mockApi.js`](src/utils/mockApi.js). When your backend REST/GraphQL services are ready, replace the mock implementations with actual HTTP calls:

```javascript
// Example replacement in src/utils/mockApi.js:

export async function mockLoginApi(role, credentials) {
  // Replace this mock with your actual API endpoint:
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, ...credentials }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Authentication failed');
  }

  const data = await response.json();
  sessionStorage.setItem('examai_auth_user', JSON.stringify(data.user));
  return data;
}
```

### Endpoints to connect:
- **`POST /api/auth/login`**: Authenticates student, teacher, or admin.
- **`POST /api/auth/register/student`**: Registers new student with roll number and institute.
- **`POST /api/auth/register/teacher`**: Registers teacher with department.
- **`GET /api/auth/me`**: Session validation.

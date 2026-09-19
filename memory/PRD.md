# AI Smart Career Analyzer — PRD

## Original Problem Statement
Build a simple, clean, fully functional "AI Smart Career Analyzer" web app:
- Accepts resume (upload or paste) + target role + company type (Product/Service)
- Analyzes resume via simple keyword matching (Java/Python/SQL/HTML/JavaScript — +20 each, max 100)
- Generates role+company-tuned interview questions
- Conducts mock interview with text/voice/video answer modes + 30s timer
- Evaluates answers and produces a final report with overall scores and suggestions
- 4 pages: Home, Resume Result, Interview, Final Report

## Tech Stack (chosen by user)
- Frontend: React (CRA) + React Router + Tailwind + shadcn/ui + sonner
- Backend: FastAPI + emergentintegrations (Claude Sonnet 4.5)
- File parsing: pdfplumber (PDF), python-docx (DOCX), txt
- Theme: Dark luxury + crimson red accents, glassmorphism, premium SaaS aesthetic

## User Personas
- Job seeker preparing for product or service-based interviews
- Bootcamp grad evaluating resume + interview readiness in one place
- Career switcher exploring role-specific question patterns

## Core Requirements (static)
- 4 sequential pages with shared state via React Context (no DB)
- Resume score 0-100 from keyword detection
- 5 dynamic LLM-generated questions per session
- Per-answer LLM evaluation 0-10 with feedback
- 30-second timer per question with auto-submit
- Text / Voice (Web Speech API) / Video (getUserMedia preview) modes
- Final report with Resume + Interview + Overall + suggestions

## What's Been Implemented (2026-02)
- ✅ Backend `/api/analyze_resume` (file + paste, pdf/docx/txt)
- ✅ Backend `/api/get_questions` (Claude Sonnet 4.5 + JSON fallback)
- ✅ Backend `/api/evaluate_answer` (Claude Sonnet 4.5 + keyword fallback)
- ✅ HomePage with form, file upload, role + company type pickers
- ✅ ResumeResultPage with animated score ring + skill chips + missing core skills
- ✅ InterviewPage with one-question-at-a-time, 30s timer, 3 input modes
- ✅ FinalResultPage with 3 score cards + per-question breakdown + restart
- ✅ Cinematic dark + crimson theme (glassmorphism, red glow, ambient gradient)
- ✅ E2E testing passed (backend 7/7, frontend full journey)

## Backlog / Future Enhancements
- P1: Persist sessions in MongoDB so users can revisit past reports
- P1: Add answer audio recording playback (currently mic transcribes only)
- P2: Export final report as PDF
- P2: Resume strength rewrite suggestions (LLM-powered diff)
- P2: Industry-specific question banks (FAANG / Big-4 / startup)
- P2: Difficulty controls (junior / mid / senior)
- P2: Share-result link with public URL

## Next Action Items
- Ask user if they want session history / report export / share links
- Improve eyebrow text contrast on Home (minor design tweak flagged in test report)

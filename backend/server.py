from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException, Query
from datetime import datetime, timezone
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import io
import re
import json
import uuid
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional


import pdfplumber
from docx import Document
from google import genai


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
gemini_client = genai.Client(api_key=GEMINI_API_KEY)
print("API KEY:", GEMINI_API_KEY )

app = FastAPI()
api_router = APIRouter(prefix="/api")

# -------------------- Skill keyword bank --------------------
SKILL_KEYWORDS = {
    "Java": ["java", "jvm", "spring", "spring boot", "jdbc", "hibernate"],
    "Python": ["python", "django", "flask", "fastapi", "pandas", "numpy"],
    "SQL": ["sql", "mysql", "postgresql", "postgres", "oracle", "plsql", "mssql"],
    "HTML": ["html", "html5"],
    "JavaScript": ["javascript", "js", "es6", "typescript", "node.js", "nodejs"],
    "React": ["react", "react.js", "reactjs", "next.js", "redux"],
    "CSS": ["css", "css3", "tailwind", "bootstrap", "sass"],
    "Git": ["git", "github", "gitlab", "bitbucket"],
    "AWS": ["aws", "amazon web services", "ec2", "s3", "lambda"],
    "Docker": ["docker", "kubernetes", "k8s", "container"],
    "Machine Learning": ["machine learning", "ml", "scikit-learn", "tensorflow", "pytorch"],
    "Data Analysis": ["data analysis", "data analyst", "excel", "tableau", "power bi", "powerbi"],
    "Prompt Engineering": ["prompt engineering", "prompt engineer", "llm", "gpt", "chatgpt", "claude"],
}

CORE_SKILLS = {"Java", "Python", "SQL", "HTML", "JavaScript"}  # +20 each, max 100


def extract_text_from_pdf(data: bytes) -> str:
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        return "\n".join((page.extract_text() or "") for page in pdf.pages)


def extract_text_from_docx(data: bytes) -> str:
    doc = Document(io.BytesIO(data))
    return "\n".join(p.text for p in doc.paragraphs)


def detect_skills(text: str) -> List[str]:
    text_lower = text.lower()
    detected = []
    for skill, keywords in SKILL_KEYWORDS.items():
        for kw in keywords:
            # use word boundary for short tokens
            pattern = r"(?<![a-zA-Z0-9])" + re.escape(kw) + r"(?![a-zA-Z0-9])"
            if re.search(pattern, text_lower):
                detected.append(skill)
                break
    return detected


def compute_resume_score(detected: List[str]) -> int:
    core_count = sum(1 for s in detected if s in CORE_SKILLS)
    return min(100, core_count * 20)


# -------------------- Models --------------------
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    success: bool
    message: str
    name: Optional[str] = None
    email: Optional[str] = None


class AnalyzeResponse(BaseModel):
    session_id: str
    resume_text: str
    detected_skills: List[str]
    resume_score: int
    role: str
    company_type: str

class HistoryItem(BaseModel):
    id: str
    user_email: str
    created_at: str
    type: str
    role: str
    company_type: str
    resume_score: int
    detected_skills: List[str]
    resume_text: str

class QuestionsRequest(BaseModel):
    session_id: str
    user_email: str
    role: str
    company_type: str
    skills: List[str]


class Question(BaseModel):
    id: str
    text: str
    time_limit_seconds: int = 60


class QuestionsResponse(BaseModel):
    questions: List[Question]


class EvaluateRequest(BaseModel):
    session_id: str
    user_email: str
    question: str
    answer: str
    role: str


class EvaluateResponse(BaseModel):
    score: int
    feedback: str


class RubricRequest(BaseModel):
    session_id: str
    user_email: str
    question: str
    answer: str
    role: str


class CriterionEval(BaseModel):
    name: str
    passed: bool
    explanation: str
    improvement_action: str


class RubricResponse(BaseModel):
    criteria: List[CriterionEval]
    feedback: str

class FinalReportRequest(BaseModel):
    session_id: str
    user_email: str
    interview_score: int
    overall_score: int
    interview_evaluation: Optional[dict] = None
    recommendations: Optional[List[str]] = None


# -------------------- Routes --------------------
@api_router.post("/register", response_model=AuthResponse)
async def register_user(payload: RegisterRequest):

    existing_user = await db.users.find_one({
        "email": payload.email.lower().strip()
    })

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    user = {
        "name": payload.name.strip(),
        "email": payload.email.lower().strip(),
        "password": payload.password
    }

    await db.users.insert_one(user)

    return AuthResponse(
        success=True,
        message="Registration successful",
        name=user["name"],
        email=user["email"]
)
@api_router.post("/login", response_model=AuthResponse)
async def login_user(payload: LoginRequest):

    user = await db.users.find_one({
        "email": payload.email.lower().strip(),
        "password": payload.password
    })

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    return AuthResponse(
        success=True,
        message="Login successful",
        name=user.get("name"),
        email=user.get("email")
)
@api_router.get("/")
async def root():
    return {"message": "AI Smart Career Analyzer API"}


@api_router.post("/analyze_resume", response_model=AnalyzeResponse)
async def analyze_resume(
    role: str = Form(...),
    company_type: str = Form(...),
    resume_text: Optional[str] = Form(None),
    user_email: str = Form(...),
    file: Optional[UploadFile] = File(None),
):
    text = ""
    if file is not None:
        data = await file.read()
        fname = (file.filename or "").lower()
        try:
            if fname.endswith(".pdf"):
                text = extract_text_from_pdf(data)
            elif fname.endswith(".docx"):
                text = extract_text_from_docx(data)
            elif fname.endswith(".txt"):
                text = data.decode("utf-8", errors="ignore")
            else:
                # try utf-8 fallback
                text = data.decode("utf-8", errors="ignore")
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Could not parse file: {exc}")
    if not text and resume_text:
        text = resume_text

    if not text.strip():
        raise HTTPException(status_code=400, detail="No resume content provided.")

    detected = detect_skills(text)
    score = compute_resume_score(detected)

    history_record = {
        "session_id": str(uuid.uuid4()),
        "user_email": user_email,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "type": "resume_analysis",
        "role": role,
        "company_type": company_type,
        "resume_score": score,
        "detected_skills": detected,
        "resume_text": text[:4000],
    }

    await db.history.insert_one(history_record)

    return AnalyzeResponse(
        session_id=history_record["session_id"],
        resume_text=text[:4000],
        detected_skills=detected,
        resume_score=score,
        role=role,
        company_type=company_type,
    )

@api_router.get("/history")
async def get_history(user_email: str = Query(...)):
    records = await db.history.find(
        {"user_email": user_email}
    ).sort("created_at", -1).to_list(100)

    for record in records:
        record.pop("_id", None)

    return records

@api_router.delete("/history/{history_id}")
async def delete_history(
    history_id: str,
    user_email: str = Query(...)
):
    result = await db.history.delete_one({
        "id": history_id,
        "user_email": user_email
    })

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="History item not found"
        )

    return {"message": "History deleted successfully"}

def _parse_json_block(s: str):
    s = s.strip()
    # Strip code fences
    if s.startswith("```"):
        s = re.sub(r"^```(?:json)?\s*", "", s)
        s = re.sub(r"\s*```$", "", s)
    # Find first json array/object
    m = re.search(r"(\[.*\]|\{.*\})", s, re.DOTALL)
    if m:
        s = m.group(1)
    return json.loads(s)


@api_router.post("/get_questions", response_model=QuestionsResponse)
async def get_questions(payload: QuestionsRequest):
    if not GEMINI_API_KEY:
     raise HTTPException(status_code=500, detail="Gemini API key not configured")

    style = (
        "conceptual, theoretical, and deep technical (product-based companies like Google, OpenAI, Amazon)"
        if payload.company_type.lower().startswith("product")
        else "basic, practical, and implementation-focused (service-based companies like TCS, Infosys, Deloitte)"
    )
    skills_str = ", ".join(payload.skills) if payload.skills else "general skills"

    system_msg = (
        "You are an expert technical interviewer. Generate exactly 5 interview questions. "
        "For EACH question also assign a realistic time_limit_seconds the candidate should get to answer, "
        "based on the question's complexity:\n"
        "- 45s: simple definitions / one-liners (e.g., 'What is JVM?')\n"
        "- 75s: medium conceptual or short-explanation questions\n"
        "- 120s: deeper conceptual / multi-part / 'explain how' questions\n"
        "- 180s: complex design, scenario, or multi-step reasoning questions\n"
        "Return ONLY a valid JSON array (no markdown, no commentary). Each item must be an object: "
        '{"question": "...", "time_limit_seconds": <int>}. '
        'Example: [{"question": "What is JVM?", "time_limit_seconds": 45}, '
        '{"question": "Design a URL shortener.", "time_limit_seconds": 180}]'
    )
    user_text = (
        f"Generate 5 interview questions for a candidate applying for the role of '{payload.role}'. "
        f"Their detected skills are: {skills_str}. "
        f"The questions must be {style}. "
        "Mix skill-specific and role-specific questions. Keep each question concevie (one or two sentences). "
        "Vary the time_limit_seconds across the 5 questions based on each one's difficulty."
    )
    prompt = system_msg + "\n\n" + user_text
    

    def _normalize_limit(val, text: str) -> int:
        try:
            n = int(val)
        except (TypeError, ValueError):
            n = 0
        if n <= 0:
            # heuristic fallback by length
            words = len(text.split())
            n = 45 if words < 12 else 75 if words < 22 else 120 if words < 35 else 180
        return max(30, min(240, n))

    try:
        response = gemini_client.models.generate_content(model="models/gemini-3.5-flash",contents=prompt)
        response = response.text
        parsed = _parse_json_block(response)
        questions = []
        for item in parsed[:5]:
            if isinstance(item, dict):
                qtext = str(item.get("question", "")).strip()
                limit = _normalize_limit(item.get("time_limit_seconds"), qtext)
            else:
                qtext = str(item).strip()
                limit = _normalize_limit(None, qtext)
            if qtext:
                questions.append(
                    Question(id=str(uuid.uuid4()), text=qtext, time_limit_seconds=limit)
                )
        if not questions:
            raise ValueError("empty questions")
        # SAVE INTERVIEW QUESTIONS TO THE SAME SESSION
        await db.history.update_one(
            {
                "session_id": payload.session_id,
                "user_email": payload.user_email
            },
            {
                "$set": {
                    "interview_questions": [
                        {
                            "id": q.id,
                            "text": q.text,
                    "time_limit_seconds": q.time_limit_seconds
                        }
                        for q in questions
                    ],
                    "interview_started": True
                }
            }
        )
        return QuestionsResponse(questions=questions)
    except Exception:
     logging.exception("LLM error generating questions")

    fallback = [
        (f"Tell us about your experience with {payload.role}.", 75),
        (f"Describe a challenging project that used {skills_str}.", 120),
        ("How do you approach debugging a complex issue?", 90),
        ("What is your strategy for learning a new technology quickly?", 60),
        ("Explain a recent concept or feature you mastered.", 90),
    ]

    fallback_questions = [
        Question(
            id=str(uuid.uuid4()),
            text=q,
            time_limit_seconds=t
        )
        for q, t in fallback
    ]

    # SAVE FALLBACK QUESTIONS TO THE SAME SESSION
    await db.history.update_one(
        {
            "session_id": payload.session_id,
            "user_email": payload.user_email
        },
        {
            "$set": {
                "interview_questions": [
                    {
                        "id": q.id,
                        "text": q.text,
                        "time_limit_seconds": q.time_limit_seconds
                    }
                    for q in fallback_questions
                ],
                "interview_started": True
            }
        }
    )

    return QuestionsResponse(questions=fallback_questions)

@api_router.post("/evaluate_answer", response_model=EvaluateResponse)
async def evaluate_answer(payload: EvaluateRequest):
    if not GEMINI_API_KEY:
     raise HTTPException(status_code=500, detail="Gemini API key not configured")

    if not payload.answer.strip():

     await db.history.update_one(
        {
            "session_id": payload.session_id,
            "user_email": payload.user_email
        },
        {
            "$push": {
                "interview_answers": {
                    "question": payload.question,
                    "answer": "",
                    "score": 0,
                    "feedback": "No answer was provided."
                }
            }
        }
    )

    return EvaluateResponse(
        score=0,
        feedback="No answer was provided."
    )

    system_msg = (
        "You are a strict but fair technical interviewer. Score the answer from 0 to 10 "
        "based on correctness, depth, relevance, and clarity. Return ONLY valid JSON in the form "
        '{"score": <int 0-10>, "feedback": "<one short sentence>"} with no markdown or extra text.'
    )
    user_text = (
        f"Role: {payload.role}\n"
        f"Question: {payload.question}\n"
        f"Candidate Answer: {payload.answer}\n\n"
        "Evaluate the answer."
    )

    prompt = system_msg + "\n\n" + user_text
    
    try:
        response = gemini_client.models.generate_content(model="models/gemini-3.5-flash",contents=prompt)
        response = response.text
        parsed = _parse_json_block(response)
        score = int(parsed.get("score", 0))
        score = max(0, min(10, score))
        feedback = str(parsed.get("feedback", "")).strip() or "Answer evaluated."

        await db.history.update_one(
    {
        "session_id": payload.session_id,
        "user_email": payload.user_email
    },
    {
        "$push": {
            "interview_answers": {
                "question": payload.question,
                "answer": payload.answer,
                "score": score,
                "feedback": feedback
            }
        }
    }
)

        return EvaluateResponse(
    score=score,
    feedback=feedback
)
    except Exception:
        logging.exception("LLM error evaluating answer")
        # Simple keyword-overlap fallback
        q_words = set(re.findall(r"[a-z]{4,}", payload.question.lower()))
        a_words = set(re.findall(r"[a-z]{4,}", payload.answer.lower()))
        overlap = len(q_words & a_words)
        score = min(10, max(1, overlap + min(5, len(a_words) // 20)))
        return EvaluateResponse(score=score, feedback="Auto-scored based on keyword overlap.")


@api_router.post("/evaluate_rubric", response_model=RubricResponse)
async def evaluate_rubric(payload: RubricRequest):
    """Evaluate a single answer against exactly 3 rubric criteria.
    The LLM only judges pass/fail per criterion and supplies an improvement action.
    Scoring/bucketing happens client-side and is fully deterministic.
    """
    if not GEMINI_API_KEY:
     raise HTTPException(status_code=500, detail="Gemini API key not configured")

    no_answer = not payload.answer.strip()

    system_msg = (
        "You are a strict, criterion-based interview rubric evaluator. "
        "Given an interview question and a candidate's answer, define EXACTLY 3 evaluation criteria "
        "specifically relevant to that question (e.g. for a JVM question: 'Defines JVM correctly', "
        "'Explains memory management', 'Mentions JIT or platform independence'). "
        "For each criterion mark passed (true/false), give a one-sentence explanation grounded in "
        "the candidate's actual words, and provide a concrete improvement_action describing exactly "
        "what the candidate should add or correct to pass that specific criterion next time. "
        "Return ONLY valid JSON, no markdown, in this exact shape: "
        '{"criteria":[{"name":"...","passed":true,"explanation":"...","improvement_action":"..."},'
        '{"name":"...","passed":false,"explanation":"...","improvement_action":"..."},'
        '{"name":"...","passed":false,"explanation":"...","improvement_action":"..."}],'
        '"feedback":"one short sentence overall"}'
    )
    user_text = (
        f"Role: {payload.role}\n"
        f"Question: {payload.question}\n"
        f"Candidate Answer: {payload.answer if not no_answer else '[No answer provided]'}\n\n"
        "Produce the rubric evaluation."
    )

    prompt = system_msg + "\n\n" + user_text
    
    try:
        response = gemini_client.models.generate_content(model="models/gemini-3.5-flash",contents=prompt)
        response = response.text
        parsed = _parse_json_block(response)
        raw_criteria = parsed.get("criteria", [])[:3]
        criteria: List[CriterionEval] = []
        for c in raw_criteria:
            criteria.append(
                CriterionEval(
                    name=str(c.get("name", "Unnamed criterion")).strip()
                    or "Unnamed criterion",
                    passed=bool(c.get("passed", False)) and not no_answer,
                    explanation=str(c.get("explanation", "")).strip()
                    or "No explanation provided.",
                    improvement_action=str(c.get("improvement_action", "")).strip()
                    or "Provide more detail directly addressing this criterion.",
                )
            )
        # Pad if LLM under-delivered
        while len(criteria) < 3:
            criteria.append(
                CriterionEval(
                    name=f"Criterion {len(criteria) + 1}",
                    passed=False,
                    explanation="Criterion could not be evaluated.",
                    improvement_action="Re-answer the question with more depth and specificity.",
                )
            )
        feedback = str(parsed.get("feedback", "")).strip() or "Answer evaluated."
        await db.history.update_one(
    {
        "session_id": payload.session_id,
        "user_email": payload.user_email
    },
    {
        "$push": {
            "rubric_evaluations": {
                "question": payload.question,
                "answer": payload.answer,
                "criteria": [
                    {
                        "name": c.name,
                        "passed": c.passed,
                        "explanation": c.explanation,
                        "improvement_action": c.improvement_action
                    }
                    for c in criteria
                ],
                "feedback": feedback
            }
        }
    }
)

        return RubricResponse(criteria=criteria,feedback=feedback)
    
    except Exception:
        logging.exception("LLM error evaluating rubric")
        # Deterministic keyword-overlap fallback (still 3 criteria)
        q_words = set(re.findall(r"[a-z]{4,}", payload.question.lower()))
        a_words = set(re.findall(r"[a-z]{4,}", payload.answer.lower()))
        overlap = len(q_words & a_words)
        criteria = [
            CriterionEval(
                name="Addresses the question directly",
                passed=(not no_answer) and overlap >= 2,
                explanation=f"Answer overlaps with {overlap} key terms from the question.",
                improvement_action="Reference the specific terms or concepts named in the question.",
            ),
            CriterionEval(
                name="Provides sufficient depth",
                passed=(not no_answer) and len(a_words) >= 25,
                explanation=f"Answer contains {len(a_words)} content words.",
                improvement_action="Expand the answer with concrete examples or technical detail.",
            ),
            CriterionEval(
                name="Demonstrates structured thinking",
                passed=(not no_answer) and len(payload.answer.split(".")) >= 3,
                explanation="Answer broken into multiple sentences indicates structure.",
                improvement_action="Organize the answer into clear steps or distinct points.",
            ),
        ]
        return RubricResponse(criteria=criteria, feedback="Auto-evaluated via fallback rubric.")


@api_router.post("/save_final_report")
async def save_final_report(payload: FinalReportRequest):
    result = await db.history.update_one(
        {
            "session_id": payload.session_id,
            "user_email": payload.user_email
        },
        {
            "$set": {
                "interview_score": payload.interview_score,
                "overall_score": payload.overall_score,
                "interview_evaluation": payload.interview_evaluation,
                "recommendations": payload.recommendations or [],
                "final_report_saved": True,
                "completed_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )

    return {
        "success": True,
        "message": "Final report saved successfully"
    }



app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

import os
import io
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://career-analyzer-19.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

SAMPLE_RESUME = "Experienced developer skilled in Python, Java, SQL and JavaScript. Built HTML pages."


def test_root():
    r = requests.get(f"{API}/")
    assert r.status_code == 200
    assert "AI Smart Career Analyzer" in r.json().get("message", "")


def test_analyze_resume_text():
    r = requests.post(f"{API}/analyze_resume", data={
        "role": "Software Developer",
        "company_type": "Product-based",
        "resume_text": SAMPLE_RESUME,
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["resume_score"] == 100
    skills = set(data["detected_skills"])
    for s in ["Java", "Python", "SQL", "HTML", "JavaScript"]:
        assert s in skills, f"Missing {s}"
    assert data["role"] == "Software Developer"


def test_analyze_resume_txt_upload():
    files = {"file": ("resume.txt", io.BytesIO(b"Python developer with SQL experience."), "text/plain")}
    r = requests.post(f"{API}/analyze_resume", data={
        "role": "Data Analyst", "company_type": "Service-based"
    }, files=files)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["resume_score"] == 40  # Python + SQL
    assert "Python" in data["detected_skills"]
    assert "SQL" in data["detected_skills"]


def test_analyze_resume_empty():
    r = requests.post(f"{API}/analyze_resume", data={
        "role": "Software Developer", "company_type": "Product-based",
    })
    assert r.status_code == 400


def test_get_questions():
    r = requests.post(f"{API}/get_questions", json={
        "role": "Software Developer",
        "company_type": "Product-based",
        "skills": ["Python", "SQL"],
    }, timeout=60)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "questions" in data
    assert len(data["questions"]) == 5
    for q in data["questions"]:
        assert "id" in q and "text" in q
        assert len(q["text"]) > 0


def test_evaluate_answer():
    r = requests.post(f"{API}/evaluate_answer", json={
        "question": "What is a Python list comprehension?",
        "answer": "A python list comprehension is a concise way to create lists, e.g. [x*x for x in range(10)].",
        "role": "Software Developer",
    }, timeout=60)
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data["score"], int)
    assert 0 <= data["score"] <= 10
    assert isinstance(data["feedback"], str) and len(data["feedback"]) > 0


def test_evaluate_empty_answer():
    r = requests.post(f"{API}/evaluate_answer", json={
        "question": "Explain SQL joins.", "answer": "   ", "role": "Software Developer",
    })
    assert r.status_code == 200
    assert r.json()["score"] == 0

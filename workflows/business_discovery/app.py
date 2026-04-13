"""
Workflow 1: Business Discovery & AI-Powered Outreach
Uses Claude to analyze leads and generate personalized outreach messages.
Run: python app.py  →  open http://localhost:5001
"""

import os
import json
import anthropic
from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

app = Flask(__name__, static_folder='static')
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# ── Sample lead database (in production: live scraping or CRM API) ──────────
SAMPLE_LEADS = [
    {
        "id": 1,
        "company": "TechFlow Solutions",
        "contact": "Sarah Mitchell",
        "title": "VP of Operations",
        "industry": "SaaS",
        "size": "50-200 employees",
        "pain_points": "manual reporting, slow onboarding",
        "website": "techflowsolutions.com",
        "linkedin": "linkedin.com/in/sarah-mitchell-techflow",
        "score": None,
        "outreach": None
    },
    {
        "id": 2,
        "company": "GreenLeaf Logistics",
        "contact": "David Chen",
        "title": "Director of Technology",
        "industry": "Logistics & Supply Chain",
        "size": "200-500 employees",
        "pain_points": "real-time tracking, carrier integration, driver communication",
        "website": "greenleaflogistics.net",
        "linkedin": "linkedin.com/in/david-chen-gl",
        "score": None,
        "outreach": None
    },
    {
        "id": 3,
        "company": "Pinnacle Dental Group",
        "contact": "Dr. Amanda Ross",
        "title": "Practice Owner",
        "industry": "Healthcare / Dental",
        "size": "10-50 employees",
        "pain_points": "patient retention, appointment reminders, billing automation",
        "website": "pinnacledental.com",
        "linkedin": None,
        "score": None,
        "outreach": None
    },
    {
        "id": 4,
        "company": "UrbanNest Realty",
        "contact": "James Fowler",
        "title": "CEO",
        "industry": "Real Estate",
        "size": "10-50 employees",
        "pain_points": "lead follow-up, social media presence, AI valuation tools",
        "website": "urbannest.realty",
        "linkedin": "linkedin.com/in/james-fowler-realty",
        "score": None,
        "outreach": None
    },
    {
        "id": 5,
        "company": "BrightMinds EdTech",
        "contact": "Priya Sharma",
        "title": "Head of Growth",
        "industry": "Education Technology",
        "size": "10-50 employees",
        "pain_points": "student engagement, content personalization, analytics",
        "website": "brightminds.io",
        "linkedin": "linkedin.com/in/priya-sharma-brightminds",
        "score": None,
        "outreach": None
    }
]

leads_store = {lead["id"]: lead.copy() for lead in SAMPLE_LEADS}


def analyze_and_generate(lead: dict, your_service: str) -> dict:
    """Call Claude to score lead and generate outreach email + LinkedIn DM."""
    prompt = f"""You are a B2B sales expert. Analyze this lead and produce:
1. A lead quality SCORE out of 10 with 2-line reasoning
2. A personalized cold EMAIL (subject + body, max 120 words)
3. A LinkedIn DM (max 60 words)

Your service/product: {your_service}

Lead details:
- Company: {lead['company']} ({lead['industry']}, {lead['size']})
- Contact: {lead['contact']} — {lead['title']}
- Known pain points: {lead['pain_points']}
- Website: {lead['website']}

Respond ONLY with valid JSON in this exact schema:
{{
  "score": <number 1-10>,
  "score_reason": "<2-line string>",
  "email": {{
    "subject": "<subject line>",
    "body": "<email body>"
  }},
  "linkedin_dm": "<message>"
}}"""

    message = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=900,
        messages=[{"role": "user", "content": prompt}]
    )
    raw = message.content[0].text.strip()
    # Strip markdown fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return send_from_directory("static", "index.html")


@app.route("/api/leads", methods=["GET"])
def get_leads():
    return jsonify(list(leads_store.values()))


@app.route("/api/analyze/<int:lead_id>", methods=["POST"])
def analyze_lead(lead_id):
    data = request.get_json(silent=True) or {}
    your_service = data.get("service", "AI automation and workflow solutions")
    lead = leads_store.get(lead_id)
    if not lead:
        return jsonify({"error": "Lead not found"}), 404
    try:
        result = analyze_and_generate(lead, your_service)
        lead["score"] = result["score"]
        lead["score_reason"] = result["score_reason"]
        lead["outreach"] = {
            "email": result["email"],
            "linkedin_dm": result["linkedin_dm"]
        }
        return jsonify(lead)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/analyze-all", methods=["POST"])
def analyze_all():
    data = request.get_json(silent=True) or {}
    your_service = data.get("service", "AI automation and workflow solutions")
    results = []
    for lead in leads_store.values():
        try:
            result = analyze_and_generate(lead, your_service)
            lead["score"] = result["score"]
            lead["score_reason"] = result["score_reason"]
            lead["outreach"] = {
                "email": result["email"],
                "linkedin_dm": result["linkedin_dm"]
            }
            results.append(lead)
        except Exception as e:
            lead["error"] = str(e)
            results.append(lead)
    return jsonify(results)


if __name__ == "__main__":
    print("🚀 Business Discovery Workflow running → http://localhost:5001")
    app.run(debug=True, port=5001)

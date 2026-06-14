import os
import sqlite3
import string
import re
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from dotenv import load_dotenv

# Load env variables
load_dotenv()

app = FastAPI(title="NayePankh Chatbot Service")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.getenv("DB_PATH", "../../chatbot_faqs.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # Create faqs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS faqs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        category TEXT
    )
    """)
    # Create chat_logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        volunteer_id INTEGER,
        question TEXT NOT NULL,
        matched_faq_id INTEGER,
        response_source TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(matched_faq_id) REFERENCES faqs(id)
    )
    """)
    conn.commit()

    # Seed initial FAQs if empty
    cursor.execute("SELECT COUNT(*) FROM faqs")
    if cursor.fetchone()[0] == 0:
        initial_faqs = [
            ("How do I register as a volunteer?", "You can sign up on our homepage by clicking the 'Register' button and filling in your details like name, email, city, skills, and availability.", "Registration"),
            ("Is there an age requirement to volunteer?", "Volunteers of all age groups are welcome! However, we suggest a minimum age of 16 for independent tasks, and younger volunteers can assist in general events with guardian consent.", "General"),
            ("How can I check my volunteer application status?", "Once you log in, your application and profile details will be displayed on your personal dashboard. Our admins will review and update your assignments.", "Account"),
            ("What kind of volunteering opportunities are available?", "We offer opportunities in teaching children, content writing, social media promotion, graphic design, fundraising, and ground-level event coordination.", "Events"),
            ("How do I contact NayePankh Foundation?", "You can contact us via email at contact@nayepankh.org or call our support helpline at +91 83770 04040. You can also visit our office in Noida, Uttar Pradesh.", "Support"),
            ("What is NayePankh Foundation?", "NayePankh Foundation is one of the leading NGOs in India working towards empowering underprivileged children, providing food, healthcare, and education.", "General")
        ]
        cursor.executemany("INSERT INTO faqs (question, answer, category) VALUES (?, ?, ?)", initial_faqs)
        conn.commit()
    conn.close()

# Initialize DB on start
init_db()

# Pydantic schemas
class AskRequest(BaseModel):
    question: str
    volunteerId: Optional[int] = None

class AskResponse(BaseModel):
    answer: str
    source: str  # "faq" or "ai"
    matchedFaqId: Optional[int] = None

class FAQBase(BaseModel):
    question: str
    answer: str
    category: Optional[str] = None

class FAQResponse(FAQBase):
    id: int

# NLP Similarity helpers
def normalize_text(text: str) -> str:
    text = text.lower()
    text = text.translate(str.maketrans("", "", string.punctuation))
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def compute_overlap_score(user_q: str, faq_q: str) -> float:
    user_words = set(normalize_text(user_q).split())
    faq_words = set(normalize_text(faq_q).split())
    if not user_words or not faq_words:
        return 0.0
    
    # DICE Coefficient similarity
    intersection = user_words.intersection(faq_words)
    dice = 2.0 * len(intersection) / (len(user_words) + len(faq_words))
    
    # Overlap Ratio (useful for short query matching in longer sentences)
    overlap = len(intersection) / min(len(user_words), len(faq_words))
    
    # Weighted score (blend of dice and overlap ratio)
    return (dice * 0.6) + (overlap * 0.4)

# LLM Fallback Helper
def call_llm_fallback(question: str, faqs: List[dict]) -> str:
    # 1. Check if AI keys exist
    openai_key = os.getenv("OPENAI_API_KEY")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    
    faq_context = "\n".join([f"Q: {f['question']}\nA: {f['answer']}" for f in faqs])
    
    system_prompt = f"""You are a helpful assistant for NayePankh Foundation.
Answer the user's question about NayePankh Foundation or volunteering.
Use the following FAQ facts to answer if possible. If the answer is not in the FAQs, answer politely using general knowledge about volunteerism, or direct them to contact@nayepankh.org / +91 83770 04040.
Keep your response friendly, clear, and concise (under 3 sentences).

FAQ Context:
{faq_context}
"""

    if openai_key:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=openai_key)
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": question}
                ],
                max_tokens=150,
                temperature=0.7
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print("OpenAI call failed:", e)

    elif anthropic_key:
        try:
            from anthropic import Anthropic
            client = Anthropic(api_key=anthropic_key)
            response = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=150,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": question}
                ],
                temperature=0.7
            )
            return response.content[0].text.strip()
        except Exception as e:
            print("Anthropic call failed:", e)

    # Simulated AI Fallback (if no API keys configured)
    # Search for keywords in user question
    q_norm = normalize_text(question)
    matching_faq = None
    keywords = ["register", "sign", "join", "age", "eligibility", "status", "dashboard", "opportunities", "teach", "skills", "contact", "phone", "email", "address", "what", "nayepankh", "ngo"]
    
    found_keywords = [kw for kw in keywords if kw in q_norm]
    if found_keywords:
        # Try to find a FAQ that contains one of the found keywords
        for faq in faqs:
            faq_q_norm = normalize_text(faq["question"])
            faq_a_norm = normalize_text(faq["answer"])
            if any(kw in faq_q_norm or kw in faq_a_norm for kw in found_keywords):
                matching_faq = faq
                break
                
    if matching_faq:
        return f"While I couldn't find a direct question match, it seems you are asking about topics related to '{found_keywords[0]}'. Here is some information from our guide: {matching_faq['answer']}"
        
    return "Thank you for asking! I couldn't find a specific FAQ matching your query. For detailed help, please contact us at contact@nayepankh.org or reach out to our team at +91 83770 04040. We would love to assist you!"

# --- HEALTH CHECK ---
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "chatbot-service"}

# --- ENDPOINTS ---

@app.post("/chatbot/ask", response_model=AskResponse)
def ask_chatbot(payload: AskRequest):
    question = payload.question
    volunteer_id = payload.volunteerId
    
    if not question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
        
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Fetch all FAQs
    cursor.execute("SELECT id, question, answer, category FROM faqs")
    faqs = [dict(row) for row in cursor.fetchall()]
    
    # Find best match
    best_score = 0.0
    best_faq = None
    
    for faq in faqs:
        score = compute_overlap_score(question, faq["question"])
        if score > best_score:
            best_score = score
            best_faq = faq
            
    # Threshold for matching (TRD suggests 0.4)
    THRESHOLD = 0.4
    
    if best_score >= THRESHOLD and best_faq is not None:
        answer = best_faq["answer"]
        source = "faq"
        matched_faq_id = best_faq["id"]
    else:
        # LLM or Simulated AI Fallback
        answer = call_llm_fallback(question, faqs)
        source = "ai"
        matched_faq_id = None
        
    # Log interaction
    cursor.execute(
        "INSERT INTO chat_logs (volunteer_id, question, matched_faq_id, response_source) VALUES (?, ?, ?, ?)",
        (volunteer_id, question, matched_faq_id, source)
    )
    conn.commit()
    conn.close()
    
    return AskResponse(answer=answer, source=source, matchedFaqId=matched_faq_id)

@app.get("/faqs", response_model=List[FAQResponse])
def get_faqs():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, question, answer, category FROM faqs")
    faqs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return faqs

@app.post("/faqs", response_model=FAQResponse)
def create_faq(faq: FAQBase):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO faqs (question, answer, category) VALUES (?, ?, ?)",
        (faq.question, faq.answer, faq.category)
    )
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return FAQResponse(id=new_id, question=faq.question, answer=faq.answer, category=faq.category)

@app.put("/faqs/{id}", response_model=FAQResponse)
def update_faq(id: int, faq: FAQBase):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM faqs WHERE id = ?", (id,))
    if cursor.fetchone()[0] == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="FAQ not found")
    
    cursor.execute(
        "UPDATE faqs SET question = ?, answer = ?, category = ? WHERE id = ?",
        (faq.question, faq.answer, faq.category, id)
    )
    conn.commit()
    conn.close()
    return FAQResponse(id=id, question=faq.question, answer=faq.answer, category=faq.category)

@app.delete("/faqs/{id}")
def delete_faq(id: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM faqs WHERE id = ?", (id,))
    if cursor.fetchone()[0] == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="FAQ not found")
        
    cursor.execute("DELETE FROM faqs WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return {"message": f"FAQ {id} deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

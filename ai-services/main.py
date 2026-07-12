import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import random
import time
import os
from dotenv import load_dotenv

# SDKs
from google import genai
# try optional import of groq to avoid hard failure when package missing
try:
    from groq import AsyncGroq
except Exception:
    AsyncGroq = None
from openai import AsyncOpenAI

load_dotenv()

# Configure Clients
gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
groq_api_key = os.getenv("GROQ_API_KEY", "")
# initialize groq_client only if import succeeded and key present
groq_client = None
if AsyncGroq and groq_api_key:
    try:
        groq_client = AsyncGroq(api_key=groq_api_key, timeout=15.0, max_retries=0)
    except Exception:
        groq_client = None
openrouter_api_key = os.getenv("OPENROUTER_API_KEY", "")
openrouter_client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=openrouter_api_key,
    timeout=15.0,
    max_retries=0,
) if openrouter_api_key else None

app = FastAPI(title="VultaCore AI Engine", version="2.0")

class BotRequest(BaseModel):
    prompt: str
    user_id: str
    bot_type: str  # 'general' or 'cyber'
    bot_name: Optional[str] = None
    context: Optional[str] = None

class BotResponse(BaseModel):
    bot_name: str
    response: str
    confidence: float
    processing_time: float
    metadata: dict

async def call_gemini(prompt: str, model_name: str = "gemini-2.0-flash"):
    try:
        response = await gemini_client.aio.models.generate_content(
            model=model_name,
            contents=prompt,
        )
        return response.text
    except Exception as e:
        return f"Gemini Error: {str(e)}"

async def call_groq(prompt: str, model_name: str = "llama-3.3-70b-versatile"):
    if groq_client is None:
        return "Groq Error: groq client not configured or unavailable (install 'groq' package and set GROQ_API_KEY)."
    try:
        chat_completion = await groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=model_name,
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        return f"Groq Error: {str(e)}"

async def call_openrouter(prompt: str, model: str = "anthropic/claude-3-haiku"):
    try:
        response = await openrouter_client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            extra_headers={
                "HTTP-Referer": "https://pwt-safety-ai.com",
                "X-Title": "PWT Safety AI",
            }
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"OpenRouter Error ({model}): {str(e)}"

@app.get("/")
def read_root():
    return {"status": "AI Service Online", "engine": "Multi-Provider (Gemini/Groq/Claude/Mistral)"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "AI Service"}

@app.post("/execute", response_model=BotResponse)
async def execute_bot(request: BotRequest):
    start_time = time.time()
    bot_name = request.bot_name or "System AI"
    
    # Prepend context if available
    full_prompt = request.prompt
    if request.context:
        full_prompt = f"ADDITIONAL CONTEXT (FILES/LOGS):\n---BEGIN CONTEXT---\n{request.context}\n---END CONTEXT---\n\nUSER PROMPT: {request.prompt}"
    
    # Provider Routing Logic
    response_text = ""
    engine_meta = ""
    
    try:
        if request.bot_type == "cyber":
            # Use Groq (Llama 3) for cyber security bots (extremely fast)
            response_text = await call_groq(f"You are a Cyber Security Expert. Analyze this: {full_prompt}")
            engine_meta = "Groq/Llama-3.3-70B"
        elif bot_name == "Text to Code":
            # Use Claude for high-end coding
            response_text = await call_openrouter(f"You are an expert coder. Write code for: {full_prompt}", "anthropic/claude-3-haiku")
            engine_meta = "Claude-3-Haiku (OpenRouter)"
        elif bot_name == "Bug Fixer":
            # Use Llama 3 on OpenRouter for bug fixing
            response_text = await call_openrouter(f"You are a debugging expert. Fix the bugs in this: {full_prompt}", "meta-llama/llama-3-8b-instruct")
            engine_meta = "Llama-3-8B (OpenRouter)"
        elif bot_name == "Error Explainer":
            # Use Gemini Flash for stability and quota
            response_text = await call_gemini(f"Explain this error in detail: {full_prompt}", "gemini-2.0-flash")
            engine_meta = "Gemini-2.0-Flash"
        else:
            # Use Gemini Flash for general tasks
            response_text = await call_gemini(f"Analyze/Process this task: {full_prompt}", "gemini-2.0-flash")
            engine_meta = "Gemini-2.0-Flash"
            
    except Exception as e:
        error_msg = str(e).lower()
        if "connection error" in error_msg or "name or service not known" in error_msg or "network is unreachable" in error_msg:
            response_text = f"Network Connection Error: The Python microservice cannot reach the cloud API ({bot_name}). Please ensure your computer is connected to the internet, or enable Offline Mode (Local GPU) in the app if you wish to run locally."
        else:
            response_text = f"Processing Error: {str(e)}"
        engine_meta = "Error Fallback"

    return BotResponse(
        bot_name=bot_name,
        response=response_text,
        confidence=0.95,
        processing_time=round(time.time() - start_time, 3),
        metadata={"engine": engine_meta, "provider": engine_meta.split('/')[0]}
    )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 29041))
    uvicorn.run(app, host="0.0.0.0", port=port)

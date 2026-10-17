import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import random
import time
import os
from dotenv import load_dotenv

# SDKs
import google.generativeai as genai
from groq import AsyncGroq
from openai import AsyncOpenAI

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# Configure Clients
gemini_api_key = (
    os.getenv("GEMINI_API_KEY") 
    or os.getenv("GEMINI_API") 
    or os.getenv("GENAI_API") 
    or os.getenv("GENAI_API_KEY") 
    or ""
).strip()
if gemini_api_key:
    genai.configure(api_key=gemini_api_key)

groq_api_key = (
    os.getenv("GROQ_API_KEY") 
    or os.getenv("GROQ_API") 
    or os.getenv("GORQ_API") 
    or os.getenv("GORQ_API_KEY") 
    or ""
).strip()
groq_client = AsyncGroq(api_key=groq_api_key, timeout=15.0, max_retries=0) if groq_api_key else None

openrouter_api_key = (
    os.getenv("OPENROUTER_API_KEY") 
    or os.getenv("OPENROUTER_API") 
    or ""
).strip()
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

async def call_gemini(prompt: str, model_name: str = "gemini-3.8-flash"):
    current_key = (os.getenv("GEMINI_API_KEY") or os.getenv("GEMINI_API") or os.getenv("GENAI_API") or "").strip()
    if not current_key:
        return "Gemini Error: GEMINI_API_KEY is not configured in environment variables."
    models_to_try = [model_name, "gemini-3.8-flash", "gemini-flash-latest"]
    last_err = ""
    for m in dict.fromkeys(models_to_try):
        try:
            model = genai.GenerativeModel(m)
            response = await model.generate_content_async(prompt)
            return response.text
        except Exception as e:
            last_err = str(e)
            continue
    if "leaked" in last_err.lower() or "403" in last_err:
        return "Gemini Error: Your Gemini API key was reported as leaked by Google and has been deactivated. Please generate a fresh API key at https://aistudio.google.com/app/apikey and update GEMINI_API_KEY."
    return f"Gemini Error: {last_err}"

async def call_groq(prompt: str, model_name: str = "openai/gpt-oss-120b"):
    if not groq_client:
        return "Groq Error: GROQ_API_KEY is not configured in environment variables."
    models_to_try = [model_name, "openai/gpt-oss-120b", "qwen/qwen3.8-27b", "llama-3.3-70b-versatile"]
    last_err = ""
    for m in dict.fromkeys(models_to_try):
        try:
            chat_completion = await groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=m,
            )
            return chat_completion.choices[0].message.content
        except Exception as e:
            last_err = str(e)
            continue
    if "invalid_api_key" in last_err.lower() or "401" in last_err:
        return "Groq Error: Invalid or expired API Key. Please verify your API key in the Groq Console (https://console.groq.com/keys)."
    return f"Groq Error: {last_err}"

async def call_openrouter(prompt: str, model: str = "anthropic/claude-3-haiku"):
    if not openrouter_client:
        return "OpenRouter Error: OPENROUTER_API_KEY is not configured in environment variables."
    try:
        response = await openrouter_client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            extra_headers={
                "HTTP-Referer": "https://vultacore.techprogression.com",
                "X-Title": "VultaCore AI",
            }
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"OpenRouter Error ({model}): {str(e)}"

def is_provider_error(text: str) -> bool:
    if not text:
        return True
    return any(text.startswith(prefix) for prefix in ("Gemini Error", "Groq Error", "OpenRouter Error"))

async def try_with_fallbacks(prompt: str, priority_order: list) -> tuple:
    errors = []
    for name in priority_order:
        if name == "groq":
            res = await call_groq(prompt)
            if not is_provider_error(res):
                return res, "Groq/GPT-OSS-120B"
            errors.append(res)
        elif name == "gemini":
            res = await call_gemini(prompt)
            if not is_provider_error(res):
                return res, "Gemini-3.8-Flash"
            errors.append(res)
        elif name == "openrouter_claude":
            res = await call_openrouter(prompt, "anthropic/claude-3-haiku")
            if not is_provider_error(res):
                return res, "Claude-3-Haiku (OpenRouter)"
            errors.append(res)
        elif name == "openrouter_llama":
            res = await call_openrouter(prompt, "meta-llama/llama-3-8b-instruct")
            if not is_provider_error(res):
                return res, "Llama-3-8B (OpenRouter)"
            errors.append(res)

    return "\n\n".join(errors), "All Providers Failed"

@app.get("/")
def read_root():
    return {"status": "AI Service Online", "engine": "Multi-Provider (Gemini/Groq/Claude/Mistral)"}

@app.post("/execute", response_model=BotResponse)
async def execute_bot(request: BotRequest):
    start_time = time.time()
    bot_name = request.bot_name or "System AI"
    
    # Prepend context if available
    full_prompt = request.prompt
    if request.context:
        full_prompt = f"ADDITIONAL CONTEXT (FILES/LOGS):\n---BEGIN CONTEXT---\n{request.context}\n---END CONTEXT---\n\nUSER PROMPT: {request.prompt}"
    
    # Provider Routing Logic with Resilient Fallbacks
    try:
        if request.bot_type == "cyber":
            response_text, engine_meta = await try_with_fallbacks(
                f"You are a Cyber Security Expert. Analyze this: {full_prompt}",
                ["groq", "gemini", "openrouter_llama"]
            )
        elif bot_name == "Text to Code":
            response_text, engine_meta = await try_with_fallbacks(
                f"You are an expert coder. Write code for: {full_prompt}",
                ["openrouter_claude", "gemini", "groq"]
            )
        elif bot_name == "Bug Fixer":
            response_text, engine_meta = await try_with_fallbacks(
                f"You are a debugging expert. Fix the bugs in this: {full_prompt}",
                ["openrouter_llama", "gemini", "groq"]
            )
        else:
            response_text, engine_meta = await try_with_fallbacks(
                f"Analyze/Process this task: {full_prompt}",
                ["gemini", "groq", "openrouter_llama"]
            )
            
    except Exception as e:
        error_msg = str(e).lower()
        if "connection error" in error_msg or "name or service not known" in error_msg or "network is unreachable" in error_msg:
            response_text = f"Network Connection Error: The Python microservice cannot reach cloud APIs ({bot_name}). Please ensure server internet access is available."
        else:
            response_text = f"Processing Error: {str(e)}"
        engine_meta = "Error Fallback"

    return BotResponse(
        bot_name=bot_name,
        response=response_text,
        confidence=0.95,
        processing_time=round(time.time() - start_time, 3),
        metadata={"engine": engine_meta, "provider": engine_meta.split('/')[0] if '/' in engine_meta else engine_meta}
    )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

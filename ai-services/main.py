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
from groq import Groq
from openai import OpenAI

load_dotenv()

# Configure Clients
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
openrouter_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

app = FastAPI(title="SaaS 2.0 AI Engine", version="2.0")

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

async def call_gemini(prompt: str, model_name: str = "gemini-flash-latest"):
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Gemini Error: {str(e)}"

async def call_groq(prompt: str, model_name: str = "llama-3.3-70b-versatile"):
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=model_name,
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        return f"Groq Error: {str(e)}"

async def call_openrouter(prompt: str, model: str = "anthropic/claude-3-haiku"):
    try:
        response = openrouter_client.chat.completions.create(
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
            # Use Mistral (Mixtral 8x7B) for bug fixing logic
            response_text = await call_openrouter(f"You are a debugging expert. Fix the bugs in this: {full_prompt}", "mistralai/mixtral-8x7b-instruct")
            engine_meta = "Mixtral-8x7B (OpenRouter)"
        elif bot_name == "Error Explainer":
            # Use Gemini Pro for complex explanations
            response_text = await call_gemini(f"Explain this error in detail: {full_prompt}", "gemini-pro-latest")
            engine_meta = "Gemini-Pro-Latest"
        else:
            # Use Gemini Flash for general tasks
            response_text = await call_gemini(f"Analyze/Process this task: {full_prompt}", "gemini-flash-latest")
            engine_meta = "Gemini-Flash-Latest"
            
    except Exception as e:
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
    uvicorn.run(app, host="0.0.0.0", port=8000)

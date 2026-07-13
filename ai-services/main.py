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
# pyrefly: ignore [missing-import]
from groq import AsyncGroq
# pyrefly: ignore [missing-import]
from openai import AsyncOpenAI
import httpx

load_dotenv()

# Configure Clients
gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
groq_api_key = os.getenv("GROQ_API_KEY", "")
groq_client = AsyncGroq(api_key=groq_api_key, timeout=15.0, max_retries=0) if groq_api_key else None
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

async def call_ollama(prompt: str, model: str = "llama3"):
    """Local offline inference on Desktop GPU/Memory via Ollama."""
    url = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{url}/api/generate",
                json={"model": model, "prompt": prompt, "stream": False}
            )
            response.raise_for_status()
            return response.json().get("response", "")
    except Exception as e:
        return f"Ollama Local Error: {str(e)}"

@app.get("/")
def read_root():
    return {"status": "AI Service Online", "engine": "Multi-Provider (Gemini/Groq/Claude/Ollama)"}

@app.post("/execute", response_model=BotResponse)
async def execute_bot(request: BotRequest):
    start_time = time.time()
    bot_name = request.bot_name or "System AI"
    
    # Prepend context if available
    full_prompt = request.prompt
    if request.context:
        full_prompt = f"ADDITIONAL CONTEXT (FILES/LOGS):\n---BEGIN CONTEXT---\n{request.context}\n---END CONTEXT---\n\nUSER PROMPT: {request.prompt}"
    
    # ── Provider Routing & Automatic Fallback ────────────────────────────────
    # Each entry is a (callable, label) pair. On quota / rate-limit / auth
    # errors the engine transparently moves to the next provider in the chain.

    QUOTA_SIGNALS = (
        "429", "resource_exhausted", "rate_limit", "rate limit",
        "quota", "too many requests", "exceeded", "insufficient_quota",
        "402", "401", "invalid_api_key", "unauthorized",
    )
    NETWORK_SIGNALS = (
        "connection error", "name or service not known", "network is unreachable",
        "timeout", "socket", "connect", "dns", "failed to establish a new connection",
    )

    def is_quota_or_network_error(text: str) -> bool:
        t = text.lower()
        return any(sig in t for sig in QUOTA_SIGNALS + NETWORK_SIGNALS)

    async def try_providers(chain: list) -> tuple[str, str]:
        """Try each (coroutine_factory, label) in order; skip on quota/network errors."""
        last_err = "No providers available"
        for factory, label in chain:
            try:
                result = await factory()
                if is_quota_or_network_error(result):
                    last_err = result
                    continue          # try next provider
                return result, label
            except Exception as exc:
                last_err = str(exc)
                if is_quota_or_network_error(last_err):
                    continue          # try next provider
                raise                 # real error — bubble up
        return last_err, "All-Providers-Exhausted"

    # ── Per-bot provider chains (primary first, fallbacks after) ─────────────
    cyber_prompt   = f"You are a Cyber Security Expert. Analyze this: {full_prompt}"
    general_prompt = f"Analyze/Process this task: {full_prompt}"
    code_prompt    = f"You are an expert coder. Write code for: {full_prompt}"
    bug_prompt     = f"You are a debugging expert. Fix the bugs in this: {full_prompt}"
    error_prompt   = f"Explain this error in detail: {full_prompt}"

    # Shared fallback tail available to all chains
    def groq_factory(p): return lambda: call_groq(p)
    def gemini_factory(p, m="gemini-2.0-flash"): return lambda: call_gemini(p, m)
    def openrouter_factory(p, m): return lambda: call_openrouter(p, m)
    def ollama_factory(p, m="llama3"): return lambda: call_ollama(p, m)

    GROQ_FALLBACK   = [(groq_factory(general_prompt),   "Groq/Llama-3.3-70B")]
    GEMINI_FALLBACK = [(gemini_factory(general_prompt),  "Gemini-2.0-Flash")]

    if request.bot_type == "cyber":
        chain = [
            (groq_factory(cyber_prompt),                               "Groq/Llama-3.3-70B"),
            (openrouter_factory(cyber_prompt, "anthropic/claude-3-haiku"), "Claude-3-Haiku"),
            (gemini_factory(cyber_prompt),                             "Gemini-2.0-Flash"),
            (ollama_factory(cyber_prompt, "llama3"),                   "Ollama-Local-Llama3"),
        ]
    elif bot_name == "Text to Code":
        chain = [
            (openrouter_factory(code_prompt, "anthropic/claude-3-haiku"),          "Claude-3-Haiku"),
            (openrouter_factory(code_prompt, "meta-llama/llama-3-8b-instruct"),    "Llama-3-8B"),
            (groq_factory(code_prompt),                                            "Groq/Llama-3.3-70B"),
            (gemini_factory(code_prompt),                                          "Gemini-2.0-Flash"),
            (ollama_factory(code_prompt, "codellama"),                             "Ollama-Local-CodeLlama"),
        ]
    elif bot_name == "Bug Fixer":
        chain = [
            (openrouter_factory(bug_prompt, "meta-llama/llama-3-8b-instruct"), "Llama-3-8B"),
            (groq_factory(bug_prompt),                                          "Groq/Llama-3.3-70B"),
            (openrouter_factory(bug_prompt, "anthropic/claude-3-haiku"),       "Claude-3-Haiku"),
            (gemini_factory(bug_prompt),                                        "Gemini-2.0-Flash"),
            (ollama_factory(bug_prompt, "llama3"),                              "Ollama-Local-Llama3"),
        ]
    elif bot_name == "Error Explainer":
        chain = [
            (gemini_factory(error_prompt),                                      "Gemini-2.0-Flash"),
            (groq_factory(error_prompt),                                        "Groq/Llama-3.3-70B"),
            (openrouter_factory(error_prompt, "anthropic/claude-3-haiku"),     "Claude-3-Haiku"),
            (ollama_factory(error_prompt, "llama3"),                            "Ollama-Local-Llama3"),
        ]
    else:
        # General fallback chain
        chain = [
            (gemini_factory(general_prompt),                                    "Gemini-2.0-Flash"),
            (groq_factory(general_prompt),                                      "Groq/Llama-3.3-70B"),
            (openrouter_factory(general_prompt, "anthropic/claude-3-haiku"),   "Claude-3-Haiku"),
            (openrouter_factory(general_prompt, "meta-llama/llama-3-8b-instruct"), "Llama-3-8B"),
            (ollama_factory(general_prompt, "llama3"),                          "Ollama-Local-Llama3"),
        ]

    try:
        response_text, engine_meta = await try_providers(chain)
    except Exception as e:
        error_msg = str(e).lower()
        if any(k in error_msg for k in NETWORK_SIGNALS):
            response_text = (
                f"Offline Mode Critical Error: The AI microservice cannot reach the cloud API "
                f"({bot_name}) AND the local Ollama instance is not running. "
                f"To run completely offline, please install and run Ollama with the 'llama3' model locally."
            )
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
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

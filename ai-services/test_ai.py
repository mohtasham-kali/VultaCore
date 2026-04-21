import os
import asyncio
from dotenv import load_dotenv
import google.generativeai as genai
from groq import Groq
from openai import OpenAI

load_dotenv()

async def test_gemini():
    print("\nTesting Gemini...")
    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        # Using the base model name which should be redirected to stable
        model = genai.GenerativeModel("gemini-pro")
        response = model.generate_content("Say 'Gemini is Online'")
        print(f"Result: {response.text.strip()}")
    except Exception as e:
        print(f"Gemini Error: {e}")

async def test_groq():
    print("\nTesting Groq...")
    try:
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": "Say 'Groq is Online'"}],
            model="llama-3.3-70b-versatile",
        )
        print(f"Result: {chat_completion.choices[0].message.content.strip()}")
    except Exception as e:
        print(f"Groq Error: {e}")

async def test_claude():
    print("\nTesting Claude (OpenRouter)...")
    try:
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
        )
        response = client.chat.completions.create(
            model="anthropic/claude-3-haiku",
            messages=[{"role": "user", "content": "Say 'Claude is Online'"}],
        )
        print(f"Result: {response.choices[0].message.content.strip()}")
    except Exception as e:
        print(f"Claude Error: {e}")

async def main():
    await test_gemini()
    await test_groq()
    await test_claude()

if __name__ == "__main__":
    asyncio.run(main())

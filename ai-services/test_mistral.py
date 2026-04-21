import os
import asyncio
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

async def test_mistral():
    print("\nTesting Mistral via OpenRouter...")
    try:
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
        )
        response = client.chat.completions.create(
            model="mistralai/mixtral-8x7b-instruct",
            messages=[{"role": "user", "content": "Say 'Mistral is Online'"}],
        )
        print(f"Result: {response.choices[0].message.content.strip()}")
    except Exception as e:
        print(f"Mistral Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_mistral())

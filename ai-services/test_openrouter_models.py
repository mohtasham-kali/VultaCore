import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

models_to_test = [
    "mistralai/mixtral-8x7b-instruct",
    "mistralai/mixtral-8x7b-instruct:free",
    "meta-llama/llama-3-8b-instruct:free",
    "anthropic/claude-3-haiku"
]

for model in models_to_test:
    print(f"Testing {model}...")
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": "Hi"}],
        )
        print(f"  Success: {response.choices[0].message.content[:50]}...")
    except Exception as e:
        print(f"  Failed: {e}")

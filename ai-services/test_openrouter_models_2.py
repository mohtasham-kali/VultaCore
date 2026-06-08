import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

models_to_test = [
    "meta-llama/llama-3-8b-instruct",
    "google/gemini-flash-1.5",
    "mistralai/mistral-7b-instruct",
    "mistralai/mistral-large"
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

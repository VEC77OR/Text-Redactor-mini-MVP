# app/llm.py
import requests

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL_NAME = "qwen2.5:3b"


def edit_text(text: str, operation: str) -> str:
    """
    operation: 'paraphrase' | 'fix' | 'shorten'
    """
    if operation == "paraphrase":
        task = "Перефразируй этот текст по-русски, сохранив смысл."
    elif operation == "fix":
        task = "Исправь грамматические и орфографические ошибки в этом русском тексте."
    elif operation == "shorten":
        task = "Сократи этот русский текст, сохранив основную мысль."
    else:
        raise ValueError("Unknown operation")

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {
                "role": "system",
                "content": "Ты редактор русского текста. Испльзуй только слова на русском языке. Отвечай только изменённым текстом, без пояснений."
            },
            {
                "role": "user",
                "content": f"{task}\n\nТекст:\n{text}"
            }
        ],
        "stream": False,
    }

    resp = requests.post(OLLAMA_URL, json=payload, timeout=120)
    resp.raise_for_status()
    data = resp.json()
    return data["message"]["content"]


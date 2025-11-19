import requests

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL_NAME = "qwen2.5:3b"


def edit_text(text: str, operation: str) -> str:

    # Операции: 'paraphrase' | 'fix' | 'shorten'
    if operation == "paraphrase":
        task = "Rephrase this text, preserving the meaning."
    elif operation == "fix":
        task = "Correct the grammar and spelling errors in this text."
    elif operation == "shorten":
        task = "Shorten this text while preserving the main idea."
    else:
        raise ValueError("Unknown operation")

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {
                "role": "system",
                "content": "You are the editor of the text. Reply only with the edited text, without explanation. Use the language in which the request was made."
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

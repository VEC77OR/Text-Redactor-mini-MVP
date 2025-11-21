# Text Redactor — Mini MVP (FastAPI + Ollama)

Это mini-продукт для редактирования текста с помощью локальной LLM-модели, системой токенов, личным кабинетом и админ-панелью.

## Функциональность

### 1. ИИ-редактор текста  
Пользователь вводит текст и выбирает одну из операций:
- перефразировать  
- исправить  
- сократить  

Каждый запрос к модели списывает **1 токен**.  
Если токенов нет — обработка не выполняется.

Модель работает локально через **Ollama** (qwen2.5:3b)

---

### 2. Регистрация, логин и личный кабинет
- Регистрация по email + пароль  
- Авторизация через **JWT Bearer токен**  
- Личный кабинет содержит:
  - email пользователя
  - баланс токенов
  - форму тестового пополнения
  - ИИ-редактор

Пополнение баланса:
- вводится сумма в условной валюте  
- создаётся тестовая транзакция со статусом `success`  
- баланс увеличивается

---

### 3. Админ-панель  
Доступ только для пользователей с `is_admin = True`.

Содержит:
- список пользователей  
- список транзакций  
- форму изменения курса токена  

---

## Технологии

### Backend
- Python 3.10  
- FastAPI  
- SQLAlchemy  
- SQLite  
- Pydantic v2  
- Passlib (argon2)  
- JWT (python-jose)  
- Ollama (локальная LLM)

### Frontend
- HTML + CSS + JavaScript  
- FastAPI

---

## Структура проекта

```
backend/
    app.db
    Makefile
    requirements.txt
    app/
        auth.py
        db.py
        llm.py
        models.py
        main.py
        routers/
            billing.py
            editor.py
            admin.py
frontend/
    index.html
    admin.html
    styles.css
    app.js
    admin.js
```

---

## Требования
- Python 3.10+
- Установленный Ollama
- Желательно 8+ GB RAM

---

## Установка и запуск

### 1. Установка зависимостей

Linux/macOS
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```
Windows
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

---

### 2. Установка и запуск Ollama

Linux/macOS
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Windows
```bash
Скачать установщик
https://ollama.com/download/windows
```

На всех ОС
```bash
ollama pull qwen2.5:3b
ollama serve
```

---

### 3. Запуск backend

Linux/macOS
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

Windows
```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload
```

Открыть браузер:

```
http://127.0.0.1:8000
```

Frontend автоматически отдаётся через FastAPI.

---

## Проверка функционала

1. Зарегистрироваться  
2. Войти
3. В личном кабинете:
   - отображается email
   - отображается баланс
   - работает тестовое пополнение
   - работает ИИ-редактор  
4. Войти под админом → перейти в [`/admin.html](http://127.0.0.1:8000/admin.html)`
5. Имеющиеся аккаунты (email - пароль): 
   - test@test.com - 123456 (обычный пользователь)
   - admin@admin.com - admin (админ)

---

## Безопасность

- Пароли хэшируются Argon2  
- Авторизация через JWT Bearer  
- Токен живёт 60 минут  
- Админ-панель защищена зависимостью `check_admin`

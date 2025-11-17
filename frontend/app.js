const API_BASE = "/api";

const landing = document.getElementById("landing");
const authSection = document.getElementById("auth");
const dashboard = document.getElementById("dashboard");

const startBtn = document.getElementById("startBtn");
const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const regEmail = document.getElementById("regEmail");
const regPassword = document.getElementById("regPassword");
const regMessage = document.getElementById("regMessage");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginMessage = document.getElementById("loginMessage");

const userEmailSpan = document.getElementById("userEmail");
const userBalanceSpan = document.getElementById("userBalance");

const editorInput = document.getElementById("editorInput");
const editorOperation = document.getElementById("editorOperation");
const editorRunBtn = document.getElementById("editorRunBtn");
const editorMessage = document.getElementById("editorMessage");
const editorResult = document.getElementById("editorResult");

const validationMessages = {
  "value is not a valid email address: An email address must have an @-sign.": "Некорректный email",
  "String should have at least 4 characters": "Пароль должен содержать минимум 4 символа",
  "Field required": "Поле обязательно",
  "string_pattern_mismatch": "Некорректный формат строки",
};

let accessToken = null;

function show(section) {
  landing.classList.add("hidden");
  authSection.classList.add("hidden");
  dashboard.classList.add("hidden");
  section.classList.remove("hidden");
}

startBtn.onclick = () => show(authSection);

registerBtn.onclick = async () => {
  regMessage.textContent = "";
  regMessage.style.color = "red";

  try {
    const resp = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: regEmail.value,
        password: regPassword.value,
      }),
    });

    let data = {};
    try {
      data = await resp.json();
    } catch (_) {
      data = {};
    }

    if (!resp.ok) {
      // Ошибки валидации от Pydantic (detail = массив)
      if (Array.isArray(data.detail)) {
        regMessage.textContent = data.detail
          .map((err) => {
            const msg = err.msg;
            // если есть перевод – используем, иначе оставим оригинальный текст
            return validationMessages[msg] ?? msg;
          })
          .join(", ");
      } 
      // Ошибки нашего бэкенда
      else if (typeof data.detail === "string") {
        regMessage.textContent = data.detail;
      } else {
        regMessage.textContent = "Ошибка регистрации";
      }
      return;
    }

    // Успех
    regMessage.style.color = "green";
    regMessage.textContent = "Успешная регистрация! Теперь войдите.";
  } catch (e) {
    regMessage.textContent = "Сетевая ошибка";
  }
};

loginBtn.onclick = async () => {
  loginMessage.textContent = "";
  try {
    const form = new URLSearchParams();
    form.append("username", loginEmail.value);
    form.append("password", loginPassword.value);

    const resp = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });

    if (!resp.ok) {
      const data = await resp.json();
      loginMessage.textContent = data.detail || "Ошибка входа";
      return;
    }

    const data = await resp.json();
    accessToken = data.access_token;
    await loadMe();
    show(dashboard);
  } catch (e) {
    loginMessage.textContent = "Сетевая ошибка";
  }
};

async function loadMe() {
  const resp = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) return;
  const user = await resp.json();
  userEmailSpan.textContent = user.email;
  userBalanceSpan.textContent = user.token_balance;
}

editorRunBtn.onclick = async () => {
  editorMessage.textContent = "";
  editorResult.textContent = "";
  try {
    const resp = await fetch(`${API_BASE}/editor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        text: editorInput.value,
        operation: editorOperation.value,
      }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      editorMessage.textContent = data.detail || "Ошибка редактора";
      return;
    }
    editorResult.textContent = data.result;
    userBalanceSpan.textContent = data.new_balance;
  } catch (e) {
    editorMessage.textContent = "Сетевая ошибка";
  }
};

logoutBtn.onclick = () => {
  accessToken = null;
  show(landing);
};


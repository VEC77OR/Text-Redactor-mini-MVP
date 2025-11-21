// Плавное переключение секций
function showSection(id) {
    document.querySelectorAll("section").forEach(sec => {
        sec.classList.add("hidden");
        sec.classList.remove("fade-in");
    });

    const el = document.getElementById(id);
    el.classList.remove("hidden");

    // Лёгкая анимация
    setTimeout(() => el.classList.add("fade-in"), 10);
}

// Получение токена
function getToken() {
    return localStorage.getItem("access_token");
}

// Установка токена
function setToken(token) {
    localStorage.setItem("access_token", token);
}

// Удаление токена
function clearToken() {
    localStorage.removeItem("access_token");
}


const startBtn = document.getElementById("startBtn"); // Кнопка "Начать" в шапке
const landingStartBtn = document.getElementById("landingStartBtn"); // Кнопка "Начать работу" на лендинге

// Элементы регистрации
const registerBtn = document.getElementById("registerBtn");
const regEmail = document.getElementById("regEmail");
const regPassword = document.getElementById("regPassword");
const regMessage = document.getElementById("regMessage");

// Элементы входа
const loginBtn = document.getElementById("loginBtn");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginMessage = document.getElementById("loginMessage");

// Элементы личного кабинета
const logoutBtn = document.getElementById("logoutBtn");
const userEmail = document.getElementById("userEmail");
const userBalance = document.getElementById("userBalance");

// Элементы пополнения баланса
const topupBtn = document.getElementById("topupBtn");
const topupAmount = document.getElementById("topupAmount");
const topupMessage = document.getElementById("topupMessage");

// Элементы редактора текста
const editorRunBtn = document.getElementById("editorRunBtn");
const editorInput = document.getElementById("editorInput");
const editorOperation = document.getElementById("editorOperation");
const editorMessage = document.getElementById("editorMessage");
const editorResult = document.getElementById("editorResult");


// Открыть форму входа из любой кнопки "Начать"
[startBtn, landingStartBtn].forEach(btn => {
    if (btn) {
        btn.onclick = () => showSection("auth");
    }
});

// Если есть токен — сразу отправляем в кабинет
if (getToken()) {
    loadProfile();
} else {
    showSection("landing");
}


// Регистрация
registerBtn.onclick = async () => {
    regMessage.textContent = "";
    regMessage.style.color = "";

    const email = regEmail.value.trim();
    const password = regPassword.value.trim();

    if (!email || !password) {
        setMessage("regMessage", "msg_reg_fill_fields");
        return;
    }

    if (password.length < 4) {
        setMessage("regMessage", "msg_reg_short_password");
        return;
    }

    try {
        const resp = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await resp.json().catch(() => ({}));

        if (!resp.ok) {
            regMessage.textContent = getErrorText(data.detail, "msg_reg_error");
            regMessage.style.color = "";
            return;
        }

        regMessage.style.color = "green";
        regMessage.textContent = t("msg_reg_success");
    } catch (e) {
        regMessage.style.color = "";
        regMessage.textContent = t("msg_reg_error");
    }
};


// Вход
loginBtn.onclick = async () => {
    loginMessage.textContent = "";
    loginMessage.style.color = "";

    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();

    if (!email || !password) {
        setMessage("loginMessage", "msg_login_fill_fields");
        return;
    }

    try {
        const form = new URLSearchParams();
        form.append("username", email);
        form.append("password", password);

        const resp = await fetch("/api/auth/login", {
            method: "POST",
            body: form
        });

        const data = await resp.json().catch(() => ({}));

        if (!resp.ok) {
            loginMessage.textContent = getErrorText(data.detail, "msg_login_invalid");
            return;
        }

        // Покаываем зелёное сообщение, но сразу переходим в личный кабинет
        loginMessage.style.color = "green";
        loginMessage.textContent = t("msg_login_success");

        setToken(data.access_token);
        loadProfile();
    } catch (e) {
        loginMessage.style.color = "";
        loginMessage.textContent = t("msg_login_error");
    }
};


// Загрузка профиля
async function loadProfile() {
    try {
        const resp = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${getToken()}` }
        });

        if (!resp.ok) {
            clearToken();

            startBtn.classList.remove("hidden");
            landingStartBtn.classList.remove("hidden");

            showSection("auth");
            return;
        }

        const user = await resp.json();
        userEmail.textContent = user.email;
        userBalance.textContent = user.token_balance;

        startBtn.classList.add("hidden");
        landingStartBtn.classList.add("hidden");

        showSection("dashboard");
    } catch (e) {
        clearToken();
        showSection("auth");
    }
}


// Пополнение баланса
topupBtn.onclick = async () => {
    topupMessage.textContent = "";
    topupMessage.style.color = "";

    const amount = Number(topupAmount.value);

    if (!amount || amount <= 0) {
        setMessage("topupMessage", "msg_topup_invalid_amount");
        return;
    }

    try {
        const resp = await fetch("/api/billing/topup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`
            },
            body: JSON.stringify({ amount })
        });

        const data = await resp.json().catch(() => ({}));

        if (!resp.ok) {
            topupMessage.textContent = getErrorText(data.detail, "msg_topup_error");
            return;
        }

        userBalance.textContent = data.new_balance;
        topupMessage.style.color = "green";
        topupMessage.textContent = t("msg_topup_success");
    } catch (e) {
        topupMessage.style.color = "";
        topupMessage.textContent = t("msg_topup_error");
    }
};


// Редактирование текста
editorRunBtn.onclick = async () => {
    editorMessage.textContent = "";
    editorResult.textContent = "";
    editorMessage.style.color = "";

    const text = editorInput.value.trim();
    if (!text) {
        setMessage("editorMessage", "msg_editor_empty");
        return;
    }

    try {
        const resp = await fetch("/api/editor", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                text,
                operation: editorOperation.value
            })
        });

        const data = await resp.json().catch(() => ({}));

        if (!resp.ok) {
            editorMessage.textContent = getErrorText(data.detail, "msg_editor_error");
            return;
        }

        userBalance.textContent = data.new_balance;
        editorResult.textContent = data.result;
    } catch (e) {
        editorMessage.style.color = "";
        editorMessage.textContent = t("msg_editor_error");
    }
};


// Выход
logoutBtn.onclick = () => {
    clearToken();
    showSection("auth");
};


// Перевод
const translations = {
  en: {
    logo_text: 'AI Text Editor',
    header_start: 'Start',

    landing_title: 'AI Text Editor',
    landing_subtitle: 'Paraphrase, correct or shorten text using a local LLM — without sending data to the cloud.',
    landing_bullet1: 'Each request uses <strong>1 token</strong> from your balance.',
    landing_bullet2: 'Top up your balance in the dashboard (test mode).',
    landing_bullet3: 'Supports Russian and English.',
    landing_start_btn: 'Get started',

    auth_title: 'Sign in / Register',
    auth_register_title: 'Register',
    auth_login_title: 'Sign in',

    label_email: 'Email',
    label_password: 'Password',
    ph_email: 'you@example.com',
    ph_reg_password: 'At least 4 characters',
    ph_login_password: 'Your password',

    btn_register: 'Register',
    btn_login: 'Sign in',

    dashboard_title: 'Dashboard',
    dashboard_email_label: 'Email:',
    balance_label: 'Token balance',

    topup_title: 'Top up balance (test)',
    ph_topup_amount: 'Amount in currency',
    btn_topup: 'Top up',

    editor_title: 'AI text editor',
    editor_source_label: 'Source text',
    ph_editor_input: 'Paste the text you want to correct, paraphrase or shorten...',

    editor_operation_label: 'Operation:',
    op_fix: 'Correct',
    op_paraphrase: 'Paraphrase',
    op_shorten: 'Shorten',

    btn_editor_run: 'Process',
    editor_result_title: 'Result',

    btn_logout: 'Log out',

    // auth / login / register
    msg_reg_success: 'Registration successful! You can now sign in.',
    msg_reg_fill_fields: 'Please enter email and password.',
    msg_reg_short_password: 'Password must be at least 4 characters.',
    msg_reg_user_exists: 'A user with this email already exists.',
    msg_reg_error: 'Registration failed. Please try again.',

    msg_login_success: 'Successfully signed in.',
    msg_login_invalid: 'Invalid email or password.',
    msg_login_fill_fields: 'Please enter email and password.',
    msg_login_error: 'Login failed. Please try again.',

    // topup 
    msg_topup_success: 'Balance has been topped up.',
    msg_topup_invalid_amount: 'Enter a valid amount.',
    msg_topup_error: 'Top up failed. Please try again.',

    // editor 
    msg_editor_empty: 'Please enter some text.',
    msg_editor_no_tokens: 'Not enough tokens. Please top up your balance.',
    msg_editor_error: 'An error occurred while processing the text.'
  },

  ru: {
    logo_text: 'AI Text Editor',
    header_start: 'Начать',

    landing_title: 'AI-редактор текста',
    landing_subtitle: 'Перефразируйте, исправляйте или сокращайте текст с помощью локальной LLM — без отправки данных в облако.',
    landing_bullet1: 'Каждый запрос списывает <strong>1 токен</strong> с баланса.',
    landing_bullet2: 'Пополнение баланса в личном кабинете (тестовый режим).',
    landing_bullet3: 'Поддержка русского и английского языка.',
    landing_start_btn: 'Начать работу',

    auth_title: 'Вход / Регистрация',
    auth_register_title: 'Регистрация',
    auth_login_title: 'Вход',

    label_email: 'Email',
    label_password: 'Пароль',
    ph_email: 'you@example.com',
    ph_reg_password: 'Минимум 4 символа',
    ph_login_password: 'Ваш пароль',

    btn_register: 'Зарегистрироваться',
    btn_login: 'Войти',

    dashboard_title: 'Личный кабинет',
    dashboard_email_label: 'Email:',
    balance_label: 'Баланс токенов',

    topup_title: 'Пополнение баланса (тест)',
    ph_topup_amount: 'Сумма в валюте',
    btn_topup: 'Пополнить',

    editor_title: 'ИИ-редактор текста',
    editor_source_label: 'Исходный текст',
    ph_editor_input: 'Вставьте текст, который нужно исправить, перефразировать или сократить...',

    editor_operation_label: 'Операция:',
    op_fix: 'Исправить',
    op_paraphrase: 'Перефразировать',
    op_shorten: 'Сократить',

    btn_editor_run: 'Обработать',
    editor_result_title: 'Результат',

    btn_logout: 'Выйти',

    // auth / login / register
    msg_reg_success: 'Регистрация прошла успешно! Теперь вы можете войти.',
    msg_reg_fill_fields: 'Введите email и пароль.',
    msg_reg_short_password: 'Пароль должен быть не короче 4 символов.',
    msg_reg_user_exists: 'Пользователь с таким email уже существует.',
    msg_reg_error: 'Не удалось зарегистрироваться. Попробуйте ещё раз.',

    msg_login_success: 'Вход выполнен успешно.',
    msg_login_invalid: 'Неверный email или пароль.',
    msg_login_fill_fields: 'Введите email и пароль.',
    msg_login_error: 'Не удалось войти. Попробуйте ещё раз.',

    // topup 
    msg_topup_success: 'Баланс успешно пополнен.',
    msg_topup_invalid_amount: 'Введите корректную сумму.',
    msg_topup_error: 'Не удалось пополнить баланс. Попробуйте ещё раз.',

    // editor 
    msg_editor_empty: 'Введите текст для обработки.',
    msg_editor_no_tokens: 'Недостаточно токенов. Пополните баланс.',
    msg_editor_error: 'Произошла ошибка при обработке текста.'
  }
};

function t(key) {
  const lang = localStorage.getItem('lang') || 'ru';
  const dict = translations[lang] || translations.ru;
  return dict[key] || key; // если нет ключа — вернётся сам key
}

function setMessage(elementId, key) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = t(key);
  }
}


function getErrorText(detail, fallbackKey) {
  const lang = localStorage.getItem('lang') || 'ru';

  // Для русского — показываем, что прислал бэк, если есть
  if (lang === 'ru') {
    return detail || t(fallbackKey);
  }

  // Для английского — пытаемся распознать тип ошибки
  if (!detail) {
    return t(fallbackKey);
  }

  const d = String(detail).toLowerCase();

  // editor: недостаточно токенов 
  if (fallbackKey === 'msg_editor_error') {
    if (d.includes('токен') || d.includes('token')) {
      return t('msg_editor_no_tokens');
    }
  }

  // topup: некорректная сумма
  if (fallbackKey === 'msg_topup_error') {
    if (d.includes('сумм') || d.includes('amount')) {
      return t('msg_topup_invalid_amount');
    }
  }

  // регистрация: пользователь уже существует
  if (fallbackKey === 'msg_reg_error') {
    if (d.includes('существует') || d.includes('already')) {
      return t('msg_reg_user_exists');
    }
  }

  // логин: неверный email/пароль
  if (fallbackKey === 'msg_login_invalid' || fallbackKey === 'msg_login_error') {
    if (d.includes('неверн') || d.includes('invalid') || d.includes('password')) {
      return t('msg_login_invalid');
    }
  }

  // Если ничего не распознали — общий текст по ключу
  return t(fallbackKey);
}


function applyLanguage(lang) {
  const dict = translations[lang];
  if (!dict) return;

  // Обычные тексты
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  // Тексты с HTML (например, <strong>)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.dataset.i18nHtml;
    if (dict[key]) {
      el.innerHTML = dict[key];
    }
  });

  // Плейсхолдеры
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.dataset.i18nPh;
    if (dict[key]) {
      el.placeholder = dict[key];
    }
  });

  // Подсветка выбранной кнопки
  document.querySelectorAll('.lang-switch [data-lang]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  localStorage.setItem('lang', lang);
}

document.addEventListener('DOMContentLoaded', () => {
  // Обработчики на кнопки языка
  document.querySelectorAll('.lang-switch [data-lang]').forEach(btn => {
    btn.addEventListener('click', () => {
      applyLanguage(btn.dataset.lang);
    });
  });

  const saved = localStorage.getItem('lang') || 'ru';
  applyLanguage(saved);
});

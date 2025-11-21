const API_BASE = "/api";

// элементы формы входа администратора
const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");
const adminLoginBtn = document.getElementById("adminLoginBtn");
const adminAuthMessage = document.getElementById("adminAuthMessage");

// элементы панели администратора
const adminPanel = document.getElementById("adminPanel");
const adminUserEmail = document.getElementById("adminUserEmail");

// элементы настроек курса
const currencyInput = document.getElementById("currencyInput");
const rateInput = document.getElementById("rateInput");
const currencyLabel = document.getElementById("currencyLabel");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const settingsMessage = document.getElementById("settingsMessage");

// таблицы пользователей и транзакций
const usersTableBody = document.querySelector("#usersTable tbody");
const txTableBody = document.querySelector("#txTable tbody");

let adminToken = null; // токен текущего администратора

function showAdminPanel() {
  // скрытие блока входа и отображение панели админа
  document.getElementById("admin-auth").classList.add("hidden");
  adminPanel.classList.remove("hidden");
}

// обработчик входа администратора
adminLoginBtn.onclick = async () => {
  adminAuthMessage.textContent = "";
  adminAuthMessage.style.color = "red";

  const email = adminEmail.value.trim();
  const password = adminPassword.value.trim();

  if (!email || !password) {
    setAdminMessage("adminAuthMessage", "msg_admin_login_fill"); // отсутствие данных
    return;
  }

  try {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const resp = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      adminAuthMessage.textContent = data.detail ?? tAdmin("msg_admin_login_error"); // ошибка входа
      return;
    }

    adminToken = data.access_token; // сохраняем токен администратора

    // проверяем права администратора
    const meResp = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const me = await meResp.json().catch(() => ({}));
    if (!meResp.ok || !me.is_admin) {
      adminAuthMessage.textContent = tAdmin("msg_admin_login_forbidden");
      adminToken = null;
      return;
    }

    adminUserEmail.textContent = me.email;
    showAdminPanel();
    await loadSettings();
    await loadUsers();
    await loadTransactions();
  } catch (e) {
    adminAuthMessage.textContent = tAdmin("msg_admin_network_error"); // ошибка сети
  }
};

// загрузка настроек
async function loadSettings() {
  settingsMessage.textContent = ""; // очистка сообщений
  try {
    const resp = await fetch(`${API_BASE}/admin/settings`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await resp.json();
    if (!resp.ok) {
      settingsMessage.textContent = data.detail ?? tAdmin("msg_admin_settings_error"); // ошибка загрузки
      return;
    }

    currencyInput.value = data.currency;
    rateInput.value = data.token_rate;
    currencyLabel.textContent = data.currency;
  } catch (e) {
    settingsMessage.textContent = tAdmin("msg_admin_network_error"); // ошибка сети
  }

}

// обработчик сохранения настроек
saveSettingsBtn.onclick = async () => {
  settingsMessage.textContent = "";
  settingsMessage.style.color = "red";

  const currency = currencyInput.value.trim();
  const rate = parseFloat(rateInput.value);

  if (!currency || isNaN(rate) || rate <= 0) {
    settingsMessage.textContent = tAdmin("msg_admin_settings_invalid"); // неверные данные
    return;
  }

  try {
    const resp = await fetch(`${API_BASE}/admin/settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ currency, token_rate: rate }),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      settingsMessage.textContent = data.detail ?? tAdmin("msg_admin_settings_error"); // ошибка сохранения
      return;
    }

    settingsMessage.style.color = "green";
    settingsMessage.textContent = tAdmin("msg_admin_settings_saved"); // успешно сохранено
    currencyLabel.textContent = data.currency; // обновление отображения валюты
  } catch (e) {
    settingsMessage.textContent = tAdmin("msg_admin_network_error"); // ошибка сети
  }
};

// загрузка таблицы пользователей
async function loadUsers() {
  usersTableBody.innerHTML = "";
  try {
    const resp = await fetch(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await resp.json();
    if (!resp.ok) {
      console.error(data);
      return;
    }

    const yes = tAdmin("admin_yes");
    const no = tAdmin("admin_no");

    data.forEach((u) => {
      // добавление строки пользователя
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.id}</td>
        <td>${u.email}</td>
        <td>${u.token_balance}</td>
        <td>${u.is_admin ? yes : no}</td>
        <td>${new Date(u.created_at).toLocaleString()}</td>
      `;
      usersTableBody.appendChild(tr);
    });

  } catch (e) {
    console.error(e);
  }
}

// загрузка таблицы транзакций
async function loadTransactions() {
  txTableBody.innerHTML = "";
  try {
    const resp = await fetch(`${API_BASE}/admin/transactions`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await resp.json();
    if (!resp.ok) {
      console.error(data);
      return;
    }

    data.forEach((t) => {
      // добавление строки транзакции
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${t.id}</td>
        <td>${t.user_id}</td>
        <td>${t.amount_currency}</td>
        <td>${t.tokens}</td>
        <td>${t.currency}</td>
        <td>${t.status}</td>
        <td>${new Date(t.created_at).toLocaleString()}</td>
      `;
      txTableBody.appendChild(tr);
    });
  } catch (e) {
    console.error(e);
  }
}

// Перевод для админ-панели
// словарь переводов
const adminTranslations = {
  en: {
    admin_logo_text: 'Admin Panel',
    admin_title: 'Admin Panel',
    admin_login_title: 'Admin login',
    admin_email_ph: 'Email',
    admin_password_ph: 'Password',
    admin_login_btn: 'Sign in',
    admin_logged_in_as: 'Logged in as:',

    admin_settings_title: 'Rate settings',
    admin_currency_label: 'Currency:',
    admin_currency_ph: 'e.g. RUB',
    admin_rate_label_prefix: '1 token =',
    admin_save_settings_btn: 'Save rate',

    admin_users_title: 'Users',
    admin_users_th_id: 'ID',
    admin_users_th_email: 'Email',
    admin_users_th_balance: 'Token balance',
    admin_users_th_is_admin: 'Admin',
    admin_users_th_created_at: 'Registration date',

    admin_tx_title: 'Transactions',
    admin_tx_th_id: 'ID',
    admin_tx_th_user_id: 'User ID',
    admin_tx_th_amount: 'Amount',
    admin_tx_th_tokens: 'Tokens',
    admin_tx_th_currency: 'Currency',
    admin_tx_th_status: 'Status',
    admin_tx_th_date: 'Date',

    msg_admin_login_fill: 'Please enter email and password.',
    msg_admin_login_error: 'Admin login failed. Check credentials.',
    msg_admin_login_forbidden: 'Access denied.',
    msg_admin_settings_saved: 'Settings saved.',
    msg_admin_settings_error: 'Failed to save settings.',
    msg_admin_settings_invalid: 'Specify currency and positive rate.',
    msg_admin_network_error: 'Network error.',

    admin_yes: 'Yes',
    admin_no: 'No'    
  },

  ru: {
    admin_logo_text: 'Админ-панель',
    admin_title: 'Админ-панель',
    admin_login_title: 'Вход администратора',
    admin_email_ph: 'Email',
    admin_password_ph: 'Пароль',
    admin_login_btn: 'Войти',
    admin_logged_in_as: 'Вы вошли как:',

    admin_settings_title: 'Настройки курса',
    admin_currency_label: 'Валюта:',
    admin_currency_ph: 'Например, RUB',
    admin_rate_label_prefix: '1 токен =',
    admin_save_settings_btn: 'Сохранить курс',

    admin_users_title: 'Пользователи',
    admin_users_th_id: 'ID',
    admin_users_th_email: 'Email',
    admin_users_th_balance: 'Баланс токенов',
    admin_users_th_is_admin: 'Админ',
    admin_users_th_created_at: 'Дата регистрации',

    admin_tx_title: 'Транзакции',
    admin_tx_th_id: 'ID',
    admin_tx_th_user_id: 'User ID',
    admin_tx_th_amount: 'Сумма',
    admin_tx_th_tokens: 'Токены',
    admin_tx_th_currency: 'Валюта',
    admin_tx_th_status: 'Статус',
    admin_tx_th_date: 'Дата',

    msg_admin_login_fill: 'Введите email и пароль.',
    msg_admin_login_error: 'Ошибка входа администратора. Проверьте данные.',
    msg_admin_login_forbidden: 'Доступ запрещён.',
    msg_admin_settings_saved: 'Настройки сохранены.',
    msg_admin_settings_error: 'Не удалось сохранить настройки.',
    msg_admin_settings_invalid: 'Укажите валюту и положительный курс.',
    msg_admin_network_error: 'Сетевая ошибка.',

    admin_yes: 'Да',
    admin_no: 'Нет'
  }
};

// функции перевода
function tAdmin(key) {
  const lang = localStorage.getItem('lang') || 'ru';
  const dict = adminTranslations[lang] || adminTranslations.ru;
  return dict[key] || key;
}

function setAdminMessage(elementId, key) {
  const el = document.getElementById(elementId);
  if (el) el.textContent = tAdmin(key);
}

function applyAdminLanguage(lang) {
  const dict = adminTranslations[lang];
  if (!dict) return;

  // обновление текстов
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  // обновление плейсхолдеров
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.dataset.i18nPh;
    if (dict[key]) {
      el.placeholder = dict[key];
    }
  });

  // подсветка выбранного языка
  document.querySelectorAll('.lang-switch [data-lang]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  localStorage.setItem('lang', lang);
}

// инициализация языка
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.lang-switch [data-lang]').forEach(btn => {
    btn.addEventListener('click', () => {
      applyAdminLanguage(btn.dataset.lang); // выбор языка
    });
  });

  const saved = localStorage.getItem('lang') || 'ru'; // восстановление языка
  applyAdminLanguage(saved);
});


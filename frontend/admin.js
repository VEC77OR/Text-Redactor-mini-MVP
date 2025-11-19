const API_BASE = "/api";

const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");
const adminLoginBtn = document.getElementById("adminLoginBtn");
const adminAuthMessage = document.getElementById("adminAuthMessage");

const adminPanel = document.getElementById("adminPanel");
const adminUserEmail = document.getElementById("adminUserEmail");

const currencyInput = document.getElementById("currencyInput");
const rateInput = document.getElementById("rateInput");
const currencyLabel = document.getElementById("currencyLabel");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const settingsMessage = document.getElementById("settingsMessage");

const usersTableBody = document.querySelector("#usersTable tbody");
const txTableBody = document.querySelector("#txTable tbody");

let adminToken = null;

function showAdminPanel() {
  document.getElementById("admin-auth").classList.add("hidden");
  adminPanel.classList.remove("hidden");
}

adminLoginBtn.onclick = async () => {
  adminAuthMessage.textContent = "";
  adminAuthMessage.style.color = "red";

  try {
    const formData = new URLSearchParams();
    formData.append("username", adminEmail.value);
    formData.append("password", adminPassword.value);

    const resp = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const data = await resp.json();
    if (!resp.ok) {
      adminAuthMessage.textContent = data.detail || "Ошибка входа";
      return;
    }

    adminToken = data.access_token;

    // проверим, что это админ
    const meResp = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const me = await meResp.json();
    if (!meResp.ok || !me.is_admin) {
      adminAuthMessage.textContent = "У этого пользователя нет прав администратора";
      adminToken = null;
      return;
    }

    adminUserEmail.textContent = me.email;
    showAdminPanel();
    await loadSettings();
    await loadUsers();
    await loadTransactions();
  } catch (e) {
    adminAuthMessage.textContent = "Сетевая ошибка";
  }
};

async function loadSettings() {
  settingsMessage.textContent = "";
  try {
    const resp = await fetch(`${API_BASE}/admin/settings`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await resp.json();
    if (!resp.ok) {
      settingsMessage.textContent = data.detail || "Ошибка загрузки настроек";
      return;
    }
    currencyInput.value = data.currency;
    rateInput.value = data.token_rate;
    currencyLabel.textContent = data.currency;
  } catch (e) {
    settingsMessage.textContent = "Сетевая ошибка";
  }
}

saveSettingsBtn.onclick = async () => {
  settingsMessage.textContent = "";
  settingsMessage.style.color = "red";

  const currency = currencyInput.value.trim();
  const rate = parseFloat(rateInput.value);

  if (!currency || isNaN(rate) || rate <= 0) {
    settingsMessage.textContent = "Укажите валюту и положительный курс";
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

    const data = await resp.json();
    if (!resp.ok) {
      settingsMessage.textContent = data.detail || "Ошибка сохранения настроек";
      return;
    }

    settingsMessage.style.color = "green";
    settingsMessage.textContent = "Настройки сохранены";
    currencyLabel.textContent = data.currency;
  } catch (e) {
    settingsMessage.textContent = "Сетевая ошибка";
  }
};

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

    data.forEach((u) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.id}</td>
        <td>${u.email}</td>
        <td>${u.token_balance}</td>
        <td>${u.is_admin ? "Да" : "Нет"}</td>
        <td>${new Date(u.created_at).toLocaleString()}</td>
      `;
      usersTableBody.appendChild(tr);
    });
  } catch (e) {
    console.error(e);
  }
}

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

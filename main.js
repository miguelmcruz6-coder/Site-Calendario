import { auth } from "./firebaseConfig.js";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  createCashflow,
  listenCashflows,
  createTransaction,
  listenTransactions,
  updateTransaction,
  deleteTransaction,
  deleteCashflow,
  calculateFinancialData,
} from "./crud.js";

/*
====================================
ELEMENTOS
====================================
*/

const authSection = document.getElementById("auth-section");
const dashboardSection = document.getElementById("dashboard-section");

const loginBox = document.getElementById("login-box");
const registerBox = document.getElementById("register-box");

const authMessage = document.getElementById("auth-message");

const loading = document.getElementById("loading");

const cashflowList = document.getElementById("cashflow-list");
const transactionsTable = document.getElementById("transactions-table");

const searchCashflow = document.getElementById("search-cashflow");

let currentUser = null;
let currentCashflowId = null;

let categoryChart = null;
let balanceChart = null;

let allCashflows = {};
let currentTransactions = {};

/*
====================================
UTILS
====================================
*/

function showLoading() {
  loading.classList.remove("hidden");
}

function hideLoading() {
  loading.classList.add("hidden");
}

function formatCurrency(value) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getColorClass(value) {
  return value >= 0 ? "positive" : "negative";
}

/*
====================================
AUTH UI
====================================
*/

document.getElementById("show-register").addEventListener("click", () => {
  loginBox.classList.add("hidden");
  registerBox.classList.remove("hidden");
});

document.getElementById("show-login").addEventListener("click", () => {
  registerBox.classList.add("hidden");
  loginBox.classList.remove("hidden");
});

/*
====================================
REGISTER
====================================
*/

document.getElementById("register-btn").addEventListener("click", async () => {
  try {
    const name = document.getElementById("register-name").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    const confirmPassword = document.getElementById(
      "register-confirm-password"
    ).value;

    if (password !== confirmPassword) {
      authMessage.innerText = "As senhas não coincidem.";
      return;
    }

    showLoading();

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    await updateProfile(userCredential.user, {
      displayName: name,
    });
  } catch (error) {
    authMessage.innerText = error.message;
  } finally {
    hideLoading();
  }
});

/*
====================================
LOGIN
====================================
*/

document.getElementById("login-btn").addEventListener("click", async () => {
  try {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    showLoading();

    await signInWithEmailAndPassword(auth, email, password);
  } catch {
    authMessage.innerText = "Email ou senha inválidos.";
  } finally {
    hideLoading();
  }
});

/*
====================================
AUTH STATE
====================================
*/

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;

    authSection.classList.add("hidden");
    dashboardSection.classList.remove("hidden");

    document.getElementById("welcome-user").innerText = `Olá, ${
      user.displayName || "Usuário"
    }`;

    loadCashflows();
  } else {
    currentUser = null;

    authSection.classList.remove("hidden");
    dashboardSection.classList.add("hidden");
  }
});

/*
====================================
LOGOUT
====================================
*/

document.getElementById("logout-btn").addEventListener("click", () => {
  signOut(auth);
});

/*
====================================
CRIAR ABA
====================================
*/

document
  .getElementById("create-cashflow-btn")
  .addEventListener("click", async () => {
    const name = document.getElementById("cashflow-name").value;

    if (!name || !currentUser) return;

    await createCashflow(currentUser.uid, name);

    document.getElementById("cashflow-name").value = "";
  });

/*
====================================
PESQUISA DE ABAS
====================================
*/

searchCashflow.addEventListener("input", () => {
  renderCashflows(allCashflows);
});

/*
====================================
CARREGAR ABAS
====================================
*/

function loadCashflows() {
  listenCashflows(currentUser.uid, (cashflows) => {
    allCashflows = cashflows;

    renderCashflows(cashflows);
  });
}

function renderCashflows(cashflows) {
  cashflowList.innerHTML = "";

  const search = searchCashflow.value.toLowerCase();

  let totalBalance = 0;

  Object.entries(cashflows).forEach(([id, item]) => {
    if (!item.name.toLowerCase().includes(search)) return;

    let balance = 0;

    if (item.transactions) {
      Object.values(item.transactions).forEach((t) => {
        const value = Number(t.value);

        balance += t.type === "entrada" ? value : -value;
      });
    }

    totalBalance += balance;

    const div = document.createElement("div");
    div.className = "cashflow-item";

    if (id === currentCashflowId) {
      div.classList.add("cashflow-active");
    }

    div.innerHTML = `
      <div class="cashflow-info">
        <strong>${item.name}</strong>
        <span class="cashflow-balance ${getColorClass(balance)}">
          ${formatCurrency(balance)}
        </span>
      </div>

      <button class="delete-cashflow-btn">×</button>
    `;

    div
      .querySelector(".delete-cashflow-btn")
      .addEventListener("click", async (e) => {
        e.stopPropagation();

        if (!confirm(`Excluir "${item.name}"?`)) return;

        await deleteCashflow(currentUser.uid, id);
      });

    div.addEventListener("click", () => {
      currentCashflowId = id;

      document.getElementById("selected-cashflow-title").innerText = item.name;

      loadTransactions();
    });

    cashflowList.appendChild(div);
  });

  const sidebarBalance = document.getElementById("sidebar-balance");

  sidebarBalance.innerText = formatCurrency(totalBalance);

  sidebarBalance.className = getColorClass(totalBalance);
}

/*
====================================
TRANSAÇÕES
====================================
*/

document
  .getElementById("add-transaction-btn")
  .addEventListener("click", async () => {
    if (!currentCashflowId) {
      alert("Selecione uma aba.");
      return;
    }

    const description = document.getElementById(
      "transaction-description"
    ).value;
    const value = Number(document.getElementById("transaction-value").value);
    const type = document.getElementById("transaction-type").value;
    const category = document.getElementById("transaction-category").value;
    const date = document.getElementById("transaction-date").value;

    await createTransaction(currentUser.uid, currentCashflowId, {
      description,
      value,
      type,
      category,
      date,
    });
  });

/*
====================================
FILTROS
====================================
*/

["filter-month", "filter-year", "filter-category", "filter-type"].forEach(
  (id) => {
    document.getElementById(id).addEventListener("change", () => {
      renderTransactions(getTableFilteredTransactions());

      renderFinancialCards(getDashboardFilteredTransactions());

      renderCharts(getDashboardFilteredTransactions());
    });
  }
);

function getFilteredTransactions() {
  const month = document.getElementById("filter-month").value;
  const year = document.getElementById("filter-year").value;
  const category = document.getElementById("filter-category").value;
  const type = document.getElementById("filter-type").value;

  const filtered = {};

  Object.entries(currentTransactions).forEach(([id, item]) => {
    const date = new Date(item.date);

    const itemMonth = String(date.getMonth() + 1).padStart(2, "0");
    const itemYear = String(date.getFullYear());

    if (month && itemMonth !== month) return;
    if (year && itemYear !== year) return;
    if (category && item.category !== category) return;
    if (type && item.type !== type) return;

    filtered[id] = item;
  });

  return filtered;
}

/*
====================================
CARREGAR TRANSAÇÕES
====================================
*/

function loadTransactions() {
  listenTransactions(currentUser.uid, currentCashflowId, (transactions) => {
    currentTransactions = transactions;

    populateFilters(transactions);

    renderTransactions(getTableFilteredTransactions());
    renderFinancialCards(getDashboardFilteredTransactions());
    renderCharts(getDashboardFilteredTransactions());
  });
}

/*
====================================
POPULAR FILTERS
====================================
*/

function populateFilters(transactions) {
  const months = new Set();
  const years = new Set();
  const categories = new Set();

  Object.values(transactions).forEach((item) => {
    const date = new Date(item.date);

    months.add(String(date.getMonth() + 1).padStart(2, "0"));

    years.add(date.getFullYear());

    categories.add(item.category);
  });

  const monthSelect = document.getElementById("filter-month");
  const yearSelect = document.getElementById("filter-year");
  const categorySelect = document.getElementById("filter-category");

  monthSelect.innerHTML = `<option value="">Todos os meses</option>`;

  yearSelect.innerHTML = `<option value="">Todos os anos</option>`;

  categorySelect.innerHTML = `<option value="">Todas categorias</option>`;

  months.forEach((month) => {
    monthSelect.innerHTML += `<option value="${month}">${month}</option>`;
  });

  years.forEach((year) => {
    yearSelect.innerHTML += `<option value="${year}">${year}</option>`;
  });

  categories.forEach((category) => {
    categorySelect.innerHTML += `<option value="${category}">${category}</option>`;
  });
}

/*
====================================
RENDER TRANSAÇÕES
====================================
*/

function renderTransactions(transactions) {
  transactionsTable.innerHTML = "";

  Object.entries(transactions).forEach(([id, item]) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${item.description}</td>
      <td>${item.category}</td>
      <td class="${item.type === "entrada" ? "positive" : "negative"}">
        ${item.type}
      </td>

      <td class="${item.type === "entrada" ? "positive" : "negative"}">
        ${formatCurrency(item.value)}
      </td>

      <td>${item.date}</td>

      <td>
        <button class="action-btn edit-btn">Editar</button>
        <button class="action-btn delete-btn">Excluir</button>
      </td>
    `;

    tr.querySelector(".delete-btn").addEventListener("click", async () => {
      if (!confirm("Excluir transação?")) return;

      await deleteTransaction(currentUser.uid, currentCashflowId, id);
    });

    tr.querySelector(".edit-btn").addEventListener("click", async () => {
      const newDescription = prompt("Nova descrição:", item.description);

      if (!newDescription) return;

      await updateTransaction(currentUser.uid, currentCashflowId, id, {
        description: newDescription,
      });
    });

    transactionsTable.appendChild(tr);
  });
}

/*
====================================
CARDS
====================================
*/

function renderFinancialCards(transactions) {
  const data = calculateFinancialData(transactions);

  const incomeEl = document.getElementById("income-total");
  const expenseEl = document.getElementById("expense-total");
  const balanceEl = document.getElementById("balance-total");

  incomeEl.innerText = formatCurrency(data.income);
  expenseEl.innerText = formatCurrency(data.expense);
  balanceEl.innerText = formatCurrency(data.balance);

  incomeEl.className = "positive";
  expenseEl.className = "negative";
  balanceEl.className = getColorClass(data.balance);

  document.getElementById("transactions-total").innerText =
    data.totalTransactions;
}

function getTableFilteredTransactions() {
  const month = document.getElementById("filter-month").value;
  const year = document.getElementById("filter-year").value;
  const category = document.getElementById("filter-category").value;
  const type = document.getElementById("filter-type").value;

  const filtered = {};

  Object.entries(currentTransactions).forEach(([id, item]) => {
    const date = new Date(item.date);

    const itemMonth = String(date.getMonth() + 1).padStart(2, "0");
    const itemYear = String(date.getFullYear());

    if (month && itemMonth !== month) return;
    if (year && itemYear !== year) return;
    if (category && item.category !== category) return;
    if (type && item.type !== type) return;

    filtered[id] = item;
  });

  return filtered;
}

function getDashboardFilteredTransactions() {
  const month = document.getElementById("filter-month").value;
  const year = document.getElementById("filter-year").value;
  const category = document.getElementById("filter-category").value;

  const filtered = {};

  Object.entries(currentTransactions).forEach(([id, item]) => {
    const date = new Date(item.date);

    const itemMonth = String(date.getMonth() + 1).padStart(2, "0");
    const itemYear = String(date.getFullYear());

    if (month && itemMonth !== month) return;
    if (year && itemYear !== year) return;
    if (category && item.category !== category) return;

    filtered[id] = item;
  });

  return filtered;
}

/*
====================================
GRÁFICOS
====================================
*/

function renderCharts(transactions) {
  const valuesByCategory = {};

  let income = 0;
  let expense = 0;

  Object.values(transactions).forEach((item) => {
    if (item.type === "entrada") {
      income += Number(item.value);
    } else {
      expense += Number(item.value);

      valuesByCategory[item.category] =
        (valuesByCategory[item.category] || 0) + Number(item.value);
    }
  });

  if (categoryChart) categoryChart.destroy();
  if (balanceChart) balanceChart.destroy();

  const colors = [
    "#ff7b00",
    "#16a34a",
    "#2563eb",
    "#dc2626",
    "#9333ea",
    "#0891b2",
  ];

  categoryChart = new Chart(document.getElementById("categoryChart"), {
    type: "pie",
    data: {
      labels: Object.keys(valuesByCategory),
      datasets: [
        {
          data: Object.values(valuesByCategory),
          backgroundColor: colors,
        },
      ],
    },
  });

  balanceChart = new Chart(document.getElementById("balanceChart"), {
    type: "bar",
    data: {
      labels: ["Entradas", "Saídas"],
      datasets: [
        {
          label: "Financeiro",
          data: [income, expense],
          backgroundColor: ["#16a34a", "#dc2626"],
        },
      ],
    },
  });

  renderCategoryLegend(valuesByCategory, colors);
}

/*
====================================
LEGENDA DO GRÁFICO
====================================
*/

function renderCategoryLegend(valuesByCategory, colors) {
  let legend = document.getElementById("chart-legend");

  if (!legend) {
    legend = document.createElement("div");

    legend.id = "chart-legend";
    legend.className = "chart-legend";

    document.querySelector(".chart-card").appendChild(legend);
  }

  legend.innerHTML = "";

  const total = Object.values(valuesByCategory).reduce(
    (acc, value) => acc + value,
    0
  );

  Object.entries(valuesByCategory).forEach(([category, value], index) => {
    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;

    legend.innerHTML += `
        <div class="legend-item">

          <div class="legend-left">
            <div
              class="legend-color"
              style="background:${colors[index % colors.length]}"
            ></div>

            <span>${category}</span>
          </div>

          <strong>${percentage}%</strong>

        </div>
      `;
  });
}

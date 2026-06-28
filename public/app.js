
const pageTitle = document.getElementById("pageTitle");
const navButtons = document.querySelectorAll(".nav-btn");
const sections = document.querySelectorAll(".page-section");

const form = document.getElementById("transactionForm");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const dateInput = document.getElementById("date");
const typeInput = document.getElementById("type");
const categorySelect = document.getElementById("categorySelect");
const amountInput = document.getElementById("amount");
const descriptionInput = document.getElementById("description");

const categoryForm = document.getElementById("categoryForm");
const categoryNameInput = document.getElementById("categoryName");
const categoryKindInput = document.getElementById("categoryKind");
const categorySubmitBtn = document.getElementById("categorySubmitBtn");
const categoryCancelBtn = document.getElementById("categoryCancelBtn");
const categoriesTable = document.getElementById("categoriesTable");

const monthFilter = document.getElementById("monthFilter");
const yearFilter = document.getElementById("yearFilter");

const totalIncomeEl = document.getElementById("totalIncome");
const totalFixedEl = document.getElementById("totalFixed");
const totalVariableEl = document.getElementById("totalVariable");
const savingsBalanceEl = document.getElementById("savingsBalance");
const transactionTable = document.getElementById("transactionTable");
const monthlyDetailTable = document.getElementById("monthlyDetailTable");
const exportBtn = document.getElementById("exportBtn");

const analyticsCards = document.getElementById("analyticsCards");
const analyticsCategoryTable = document.getElementById("analyticsCategoryTable");
const insightsList = document.getElementById("insightsList");
const ruleTable = document.getElementById("ruleTable");
const comparisonTable = document.getElementById("comparisonTable");
const averageTable = document.getElementById("averageTable");
const projectionTable = document.getElementById("projectionTable");
const alertsList = document.getElementById("alertsList");
const suggestionsList = document.getElementById("suggestionsList");

let monthlyChart = null;
let chartsMonthlyChart = null;
let yearlyChart = null;
let categoryReportChart = null;
let expenseTrendChart = null;

let transactionsCache = [];
let categoriesCache = [];
let editingTransactionId = null;
let editingCategoryId = null;

const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const isMobile = () => window.innerWidth <= 520;

async function apiGetDB() {
  const response = await fetch("/api/db");
  if (!response.ok) throw new Error("No se pudo leer db.json");
  return response.json();
}

async function apiCreateTransaction(transaction) {
  const response = await fetch("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(transaction)
  });

  if (!response.ok) throw new Error("No se pudo guardar el movimiento.");
  return response.json();
}

async function apiUpdateTransaction(id, transaction) {
  const response = await fetch(`/api/transactions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(transaction)
  });

  if (!response.ok) throw new Error("No se pudo actualizar el movimiento.");
  return response.json();
}

async function apiDeleteTransaction(id) {
  const response = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("No se pudo eliminar el movimiento.");
  return response.json();
}

async function apiCreateCategory(category) {
  const response = await fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(category)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "No se pudo crear la categoría.");
  return data;
}

async function apiUpdateCategory(id, category) {
  const response = await fetch(`/api/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(category)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "No se pudo actualizar la categoría.");
  return data;
}

async function apiDeleteCategory(id) {
  const response = await fetch(`/api/categories/${id}`, { method: "DELETE" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "No se pudo eliminar la categoría.");
  return data;
}

async function refreshData() {
  const db = await apiGetDB();
  transactionsCache = db.transactions || [];
  categoriesCache = db.categories || [];
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-CA", {
    style: "currency",
    currency: "CAD"
  }).format(value || 0);
}

function pct(value) {
  const safe = Number.isFinite(value) ? value : 0;
  return `${safe.toFixed(1)}%`;
}

function getCurrentDateValue() {
  return new Date().toISOString().split("T")[0];
}

function getDateParts(dateString) {
  const date = new Date(dateString + "T00:00:00");
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate()
  };
}

function getMonth(dateString) {
  return getDateParts(dateString).month;
}

function getYear(dateString) {
  return getDateParts(dateString).year;
}

function getLastDayOfMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function buildMonthlyDate(originalDate, targetYear, targetMonth) {
  const originalDay = getDateParts(originalDate).day;
  const lastDay = getLastDayOfMonth(targetYear, targetMonth);
  const validDay = Math.min(originalDay, lastDay);

  return `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-${String(validDay).padStart(2, "0")}`;
}

function isSameOrAfterMonth(targetYear, targetMonth, startDate) {
  const start = getDateParts(startDate);
  return targetYear > start.year || (targetYear === start.year && targetMonth >= start.month);
}

function getTypeLabel(type) {
  const labels = {
    income: "Ingreso",
    fixed: "Gasto fijo",
    variable: "Gasto variable",
    savings: "Ahorro"
  };

  return labels[type] || type;
}

function getCategoryName(categoryId) {
  const category = categoriesCache.find(item => item.id === categoryId);
  return category ? category.name : "Sin categoría";
}

function setupFilters() {
  const currentYear = new Date().getFullYear();

  monthFilter.innerHTML = "";
  yearFilter.innerHTML = "";

  monthNames.forEach((month, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = month;
    monthFilter.appendChild(option);
  });

  const years = new Set(transactionsCache.map(item => getYear(item.date)));
  years.add(currentYear);

  Array.from(years).sort((a, b) => b - a).forEach(year => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearFilter.appendChild(option);
  });

  monthFilter.value = new Date().getMonth();
  yearFilter.value = currentYear;
}

function setupYearFilterIfNeeded() {
  const selectedYear = yearFilter.value;
  const years = new Set(transactionsCache.map(item => String(getYear(item.date))));
  years.add(String(new Date().getFullYear()));

  if (!years.has(selectedYear)) years.add(selectedYear);

  const currentOptions = Array.from(yearFilter.options).map(option => option.value);
  const newOptions = Array.from(years).sort((a, b) => Number(b) - Number(a));

  if (JSON.stringify(currentOptions) !== JSON.stringify(newOptions)) {
    yearFilter.innerHTML = "";

    newOptions.forEach(year => {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      yearFilter.appendChild(option);
    });

    yearFilter.value = selectedYear;
  }
}

function renderCategoryOptions() {
  const selectedType = typeInput.value;
  const selectedValue = categorySelect.value;

  const categories = categoriesCache
    .filter(category => category.kind === selectedType)
    .sort((a, b) => a.name.localeCompare(b.name));

  categorySelect.innerHTML = "";

  if (categories.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Primero crea una categoría";
    categorySelect.appendChild(option);
    return;
  }

  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    categorySelect.appendChild(option);
  });

  if (categories.some(category => category.id === selectedValue)) {
    categorySelect.value = selectedValue;
  }
}

function getTransactionsForMonth(year, month) {
  const normalTransactions = transactionsCache.filter(item => {
    if (item.type === "fixed") return false;
    return getMonth(item.date) === month && getYear(item.date) === year;
  });

  const recurringFixedExpenses = transactionsCache
    .filter(item => item.type === "fixed")
    .filter(item => isSameOrAfterMonth(year, month, item.date))
    .map(item => ({
      ...item,
      originalId: item.id,
      id: `${item.id}-${year}-${month}`,
      date: buildMonthlyDate(item.date, year, month),
      isGeneratedFixed: true
    }));

  return [...normalTransactions, ...recurringFixedExpenses];
}

function getFilteredTransactions() {
  return getTransactionsForMonth(Number(yearFilter.value), Number(monthFilter.value));
}

function calculateTotals(transactions) {
  return transactions.reduce(
    (totals, item) => {
      if (item.type === "income") totals.income += item.amount;
      if (item.type === "fixed") totals.fixed += item.amount;
      if (item.type === "variable") totals.variable += item.amount;

      totals.expenses = totals.fixed + totals.variable;
      totals.savings = totals.income - totals.expenses;

      return totals;
    },
    { income: 0, fixed: 0, variable: 0, expenses: 0, savings: 0 }
  );
}

function getYearlyTotals(year = Number(yearFilter.value)) {
  return monthNames.map((month, index) => {
    const totals = calculateTotals(getTransactionsForMonth(year, index));

    return {
      month,
      income: totals.income,
      fixed: totals.fixed,
      variable: totals.variable,
      expenses: totals.expenses,
      savings: totals.savings
    };
  });
}

function getPreviousMonthInfo() {
  let year = Number(yearFilter.value);
  let month = Number(monthFilter.value) - 1;

  if (month < 0) {
    month = 11;
    year -= 1;
  }

  return {
    year,
    month,
    transactions: getTransactionsForMonth(year, month)
  };
}

function updateSummary() {
  const totals = calculateTotals(getFilteredTransactions());

  totalIncomeEl.textContent = formatCurrency(totals.income);
  totalFixedEl.textContent = formatCurrency(totals.fixed);
  totalVariableEl.textContent = formatCurrency(totals.variable);
  savingsBalanceEl.textContent = formatCurrency(totals.savings);
}

function groupByCategory(transactions, includeIncome = false) {
  const grouped = {};

  transactions.forEach(item => {
    if (!includeIncome && item.type === "income") return;

    const name = getCategoryName(item.categoryId);
    const key = item.categoryId || name;

    if (!grouped[key]) {
      grouped[key] = {
        category: name,
        type: item.type,
        amount: 0,
        count: 0
      };
    }

    grouped[key].amount += item.amount;
    grouped[key].count += 1;
  });

  return Object.values(grouped).sort((a, b) => b.amount - a.amount);
}

function renderMonthlyDetailTable() {
  const transactions = getFilteredTransactions();
  const totals = calculateTotals(transactions);

  const rows = transactions.map(item => ({
    amount: item.amount,
    category: getCategoryName(item.categoryId),
    description: item.description || "-",
    type: item.type,
    originalId: item.originalId || item.id
  }));

  rows.push({
    amount: totals.savings,
    category: "Saldo restante",
    description: "Ahorro del mes",
    type: "savings",
    originalId: null
  });

  monthlyDetailTable.innerHTML = "";

  if (rows.length === 0) {
    monthlyDetailTable.innerHTML = '<tr><td colspan="5">No hay información para mostrar.</td></tr>';
    return;
  }

  rows
    .sort((a, b) => {
      const order = { income: 1, fixed: 2, variable: 3, savings: 4 };
      return order[a.type] - order[b.type];
    })
    .forEach(item => {
      const row = document.createElement("tr");

      if (item.type === "income") row.classList.add("income-row");
      if (item.type === "fixed" || item.type === "variable") row.classList.add("expense-row");
      if (item.type === "savings") row.classList.add("savings-row");

      const action = item.type === "fixed"
        ? `<button class="edit" data-edit-transaction-id="${item.originalId}">Editar</button>`
        : "-";

      row.innerHTML = `
        <td>${formatCurrency(item.amount)}</td>
        <td>${item.category}</td>
        <td>${item.description}</td>
        <td>${getTypeLabel(item.type)}</td>
        <td>${action}</td>
      `;

      monthlyDetailTable.appendChild(row);
    });
}

function renderTransactionTable() {
  const transactions = getFilteredTransactions();
  transactionTable.innerHTML = "";

  if (transactions.length === 0) {
    transactionTable.innerHTML = '<tr><td colspan="6">No hay movimientos registrados para este mes.</td></tr>';
    return;
  }

  transactions
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach(item => {
      const row = document.createElement("tr");
      const deleteId = item.isGeneratedFixed ? item.originalId : item.id;
      const deleteText = item.isGeneratedFixed ? "Eliminar serie" : "Eliminar";
      const description = item.isGeneratedFixed
        ? `${item.description || "-"} · Recurrente`
        : item.description || "-";

      row.innerHTML = `
        <td>${item.date}</td>
        <td>${getTypeLabel(item.type)}</td>
        <td>${getCategoryName(item.categoryId)}</td>
        <td>${description}</td>
        <td>${formatCurrency(item.amount)}</td>
        <td><button class="danger" data-delete-transaction-id="${deleteId}">${deleteText}</button></td>
      `;

      transactionTable.appendChild(row);
    });
}

function renderCategoriesTable() {
  categoriesTable.innerHTML = "";

  if (categoriesCache.length === 0) {
    categoriesTable.innerHTML = '<tr><td colspan="4">No hay categorías registradas.</td></tr>';
    return;
  }

  categoriesCache
    .sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name))
    .forEach(category => {
      const usage = transactionsCache.filter(transaction => transaction.categoryId === category.id).length;
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${category.name}</td>
        <td>${getTypeLabel(category.kind)}</td>
        <td>${usage} movimiento(s)</td>
        <td>
          <button class="edit" data-edit-category-id="${category.id}">Editar</button>
          <button class="danger" data-delete-category-id="${category.id}">Eliminar</button>
        </td>
      `;

      categoriesTable.appendChild(row);
    });
}

function chartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: isMobile() ? "bottom" : "top",
        labels: {
          boxWidth: isMobile() ? 12 : 40
        }
      },
      tooltip: {
        callbacks: {
          label: context => `${context.dataset.label || context.label}: ${formatCurrency(context.raw)}`
        }
      }
    }
  };
}

function renderMonthlyChartIn(canvasId, name) {
  const totals = calculateTotals(getFilteredTransactions());
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  if (name === "monthly" && monthlyChart) monthlyChart.destroy();
  if (name === "chartsMonthly" && chartsMonthlyChart) chartsMonthlyChart.destroy();

  const chart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Gastos fijos", "Gastos variables", "Ahorro"],
      datasets: [{
        label: "Monto",
        data: [
          Math.max(totals.fixed, 0),
          Math.max(totals.variable, 0),
          Math.max(totals.savings, 0)
        ]
      }]
    },
    options: chartOptions()
  });

  if (name === "monthly") monthlyChart = chart;
  if (name === "chartsMonthly") chartsMonthlyChart = chart;
}

function renderCategoryReportChart() {
  const grouped = groupByCategory(getFilteredTransactions(), false);
  const canvas = document.getElementById("categoryReportChart");
  if (!canvas) return;

  if (categoryReportChart) categoryReportChart.destroy();

  categoryReportChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: grouped.map(item => item.category),
      datasets: [{
        label: "Gasto por categoría",
        data: grouped.map(item => item.amount)
      }]
    },
    options: {
      ...chartOptions(),
      indexAxis: grouped.length > 4 || isMobile() ? "y" : "x",
      scales: {
        x: { beginAtZero: true },
        y: { beginAtZero: true }
      }
    }
  });
}

function renderYearlyChart() {
  const data = getYearlyTotals();
  const canvas = document.getElementById("yearlyChart");
  if (!canvas) return;

  if (yearlyChart) yearlyChart.destroy();

  yearlyChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: data.map(item => isMobile() ? item.month.slice(0, 3) : item.month),
      datasets: [
        { label: "Ingresos", data: data.map(item => item.income) },
        { label: "Fijos", data: data.map(item => item.fixed) },
        { label: "Variables", data: data.map(item => item.variable) },
        { label: "Ahorro", data: data.map(item => item.savings) }
      ]
    },
    options: {
      ...chartOptions(),
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function renderExpenseTrendChart() {
  const data = getYearlyTotals();
  const canvas = document.getElementById("expenseTrendChart");
  if (!canvas) return;

  if (expenseTrendChart) expenseTrendChart.destroy();

  expenseTrendChart = new Chart(canvas, {
    type: "line",
    data: {
      labels: data.map(item => isMobile() ? item.month.slice(0, 3) : item.month),
      datasets: [
        { label: "Gastos", data: data.map(item => item.expenses), tension: 0.25 },
        { label: "Ahorro", data: data.map(item => item.savings), tension: 0.25 }
      ]
    },
    options: {
      ...chartOptions(),
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function rowClassByStatus(status) {
  if (status === "OK") return "good";
  if (status === "Revisar") return "warning";
  return "danger-text";
}

function renderAnalytics() {
  const transactions = getFilteredTransactions();
  const totals = calculateTotals(transactions);
  const previous = calculateTotals(getPreviousMonthInfo().transactions);

  const savingsRate = totals.income > 0 ? (totals.savings / totals.income) * 100 : 0;
  const expenseRate = totals.income > 0 ? (totals.expenses / totals.income) * 100 : 0;
  const fixedRate = totals.expenses > 0 ? (totals.fixed / totals.expenses) * 100 : 0;
  const variableRate = totals.expenses > 0 ? (totals.variable / totals.expenses) * 100 : 0;

  const grouped = groupByCategory(transactions, false);
  const top = grouped[0];

  const yearly = getYearlyTotals();
  const activeMonths = yearly.filter(item => item.income || item.expenses || item.savings);
  const monthsCount = Math.max(activeMonths.length, 1);

  const yearIncome = yearly.reduce((sum, item) => sum + item.income, 0);
  const yearFixed = yearly.reduce((sum, item) => sum + item.fixed, 0);
  const yearVariable = yearly.reduce((sum, item) => sum + item.variable, 0);
  const yearExpenses = yearly.reduce((sum, item) => sum + item.expenses, 0);
  const yearSavings = yearly.reduce((sum, item) => sum + item.savings, 0);

  const avgIncome = yearIncome / monthsCount;
  const avgExpenses = yearExpenses / monthsCount;
  const avgSavings = yearSavings / monthsCount;

  analyticsCards.innerHTML = `
    <div class="analytics-card"><h4>Tasa de ahorro</h4><p>${pct(savingsRate)}</p><small>Ahorro / ingresos</small></div>
    <div class="analytics-card"><h4>Tasa de gasto</h4><p>${pct(expenseRate)}</p><small>Gastos / ingresos</small></div>
    <div class="analytics-card"><h4>Fijos sobre gastos</h4><p>${pct(fixedRate)}</p><small>Pagos recurrentes</small></div>
    <div class="analytics-card"><h4>Variables sobre gastos</h4><p>${pct(variableRate)}</p><small>Gastos ajustables</small></div>
    <div class="analytics-card"><h4>Gasto diario estimado</h4><p>${formatCurrency(totals.expenses / 30)}</p><small>Promedio simple mensual</small></div>
    <div class="analytics-card"><h4>Ahorro proyectado</h4><p>${formatCurrency(avgSavings * 12)}</p><small>Promedio anualizado</small></div>
    <div class="analytics-card"><h4>Categoría más alta</h4><p>${top ? top.category : "-"}</p><small>${top ? formatCurrency(top.amount) : "Sin datos"}</small></div>
    <div class="analytics-card"><h4>Meses con datos</h4><p>${activeMonths.length}</p><small>Año seleccionado</small></div>
  `;

  analyticsCategoryTable.innerHTML = "";

  if (grouped.length === 0) {
    analyticsCategoryTable.innerHTML = '<tr><td colspan="4">No hay gastos para analizar.</td></tr>';
  } else {
    grouped.forEach(item => {
      const percent = totals.income > 0 ? (item.amount / totals.income) * 100 : 0;
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${item.category}</td>
        <td>${getTypeLabel(item.type)}</td>
        <td>${formatCurrency(item.amount)}</td>
        <td>${pct(percent)}</td>
      `;

      analyticsCategoryTable.appendChild(row);
    });
  }

  ruleTable.innerHTML = "";
  [
    { name: "Necesidades / fijos", amount: totals.fixed, value: totals.income > 0 ? totals.fixed / totals.income * 100 : 0, goal: "≤ 50%", limit: 50, mode: "max" },
    { name: "Variables", amount: totals.variable, value: totals.income > 0 ? totals.variable / totals.income * 100 : 0, goal: "≤ 30%", limit: 30, mode: "max" },
    { name: "Ahorro", amount: totals.savings, value: savingsRate, goal: "≥ 20%", limit: 20, mode: "min" }
  ].forEach(item => {
    const status = item.mode === "max"
      ? (item.value <= item.limit ? "OK" : "Revisar")
      : (item.value >= item.limit ? "OK" : "Bajo");

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${formatCurrency(item.amount)}</td>
      <td>${pct(item.value)}</td>
      <td>${item.goal}</td>
      <td class="${rowClassByStatus(status)}">${status}</td>
    `;

    ruleTable.appendChild(row);
  });

  comparisonTable.innerHTML = "";
  [
    ["Ingresos", totals.income, previous.income],
    ["Gastos fijos", totals.fixed, previous.fixed],
    ["Gastos variables", totals.variable, previous.variable],
    ["Gastos totales", totals.expenses, previous.expenses],
    ["Ahorro", totals.savings, previous.savings]
  ].forEach(([name, current, old]) => {
    const diff = current - old;
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${name}</td>
      <td>${formatCurrency(current)}</td>
      <td>${formatCurrency(old)}</td>
      <td class="${diff > 0 ? "warning" : diff < 0 ? "good" : ""}">${formatCurrency(diff)}</td>
    `;

    comparisonTable.appendChild(row);
  });

  averageTable.innerHTML = "";
  [
    ["Ingresos", avgIncome, yearIncome],
    ["Gastos fijos", yearFixed / monthsCount, yearFixed],
    ["Gastos variables", yearVariable / monthsCount, yearVariable],
    ["Gastos totales", avgExpenses, yearExpenses],
    ["Ahorro", avgSavings, yearSavings]
  ].forEach(([name, avg, total]) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${name}</td><td>${formatCurrency(avg)}</td><td>${formatCurrency(total)}</td>`;
    averageTable.appendChild(row);
  });

  projectionTable.innerHTML = "";
  [
    ["Ingresos", avgIncome * 12, "Estimado según tus meses con datos"],
    ["Gastos", avgExpenses * 12, "Proyección de salida anual"],
    ["Ahorro", avgSavings * 12, avgSavings >= 0 ? "Vas en positivo si mantienes el ritmo" : "Riesgo de cerrar el año en negativo"]
  ].forEach(([name, value, comment]) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${name}</td><td>${formatCurrency(value)}</td><td>${comment}</td>`;
    projectionTable.appendChild(row);
  });

  const alerts = [];
  const suggestions = [];
  const insights = [];

  if (totals.income === 0) alerts.push("No hay ingresos registrados este mes.");
  if (totals.savings < 0) alerts.push("Tus gastos superan tus ingresos.");
  if (expenseRate > 80) alerts.push("Tus gastos consumen más del 80% de tus ingresos.");
  if (fixedRate > 60) alerts.push("Tus gastos fijos pesan más del 60% de tus gastos totales.");
  if (top && totals.income > 0 && top.amount / totals.income * 100 > 35) {
    alerts.push(`La categoría "${top.category}" supera el 35% de tus ingresos.`);
  }

  if (totals.variable > totals.fixed) suggestions.push("Crea límites semanales para tus gastos variables.");
  if (savingsRate < 20 && totals.income > 0) suggestions.push("Intenta separar el ahorro apenas recibes ingresos.");
  if (top) suggestions.push(`Revisa "${top.category}", porque es tu mayor salida del mes.`);
  if (previous.expenses > 0 && totals.expenses > previous.expenses) suggestions.push("Tus gastos subieron vs el mes anterior.");

  if (totals.income === 0) {
    insights.push("Empieza registrando ingresos para que el análisis sea más preciso.");
  } else if (savingsRate >= 20) {
    insights.push("Tu ahorro está en una zona saludable según la regla 50/30/20.");
  } else {
    insights.push("Tu ahorro está por debajo del 20%; revisa gastos variables y pagos recurrentes.");
  }

  if (activeMonths.length > 0) {
    insights.push(`Tu ahorro mensual promedio del año es ${formatCurrency(avgSavings)}.`);
  }

  alertsList.innerHTML = (alerts.length ? alerts : ["Sin alertas críticas para este mes."]).map(item => `<li>${item}</li>`).join("");
  suggestionsList.innerHTML = (suggestions.length ? suggestions : ["Agrega más movimientos para generar sugerencias más precisas."]).map(item => `<li>${item}</li>`).join("");
  insightsList.innerHTML = insights.map(item => `<li>${item}</li>`).join("");
}

function refreshDashboard() {
  setupYearFilterIfNeeded();
  renderCategoryOptions();
  updateSummary();
  renderMonthlyDetailTable();
  renderTransactionTable();
  renderCategoriesTable();
  renderMonthlyChartIn("monthlyChart", "monthly");
  renderMonthlyChartIn("chartsMonthlyChart", "chartsMonthly");
  renderCategoryReportChart();
  renderYearlyChart();
  renderExpenseTrendChart();
  renderAnalytics();
}

function startEditingTransaction(id) {
  const transaction = transactionsCache.find(item => item.id === id);
  if (!transaction) return;

  editingTransactionId = id;

  dateInput.value = transaction.date;
  typeInput.value = transaction.type;
  typeInput.disabled = transaction.type === "fixed";
  renderCategoryOptions();
  categorySelect.value = transaction.categoryId;
  amountInput.value = transaction.amount;
  descriptionInput.value = transaction.description || "";

  submitBtn.textContent = "Guardar cambios";
  cancelEditBtn.classList.remove("hidden");

  showSection("transactionsSection");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cancelEditingTransaction() {
  editingTransactionId = null;
  form.reset();
  dateInput.value = getCurrentDateValue();
  typeInput.disabled = false;
  submitBtn.textContent = "Agregar";
  cancelEditBtn.classList.add("hidden");
  renderCategoryOptions();
}

async function addOrUpdateTransaction(event) {
  event.preventDefault();

  if (!categorySelect.value) {
    alert("Primero crea o selecciona una categoría.");
    return;
  }

  const transaction = {
    date: dateInput.value,
    type: typeInput.value,
    categoryId: categorySelect.value,
    amount: Number(amountInput.value),
    description: descriptionInput.value.trim()
  };

  if (editingTransactionId) {
    await apiUpdateTransaction(editingTransactionId, transaction);
    alert("Movimiento actualizado en db.json.");
  } else {
    await apiCreateTransaction(transaction);

    if (transaction.type === "fixed") {
      alert("Gasto fijo guardado como recurrente.");
    }
  }

  await refreshData();

  const selectedDate = transaction.date;
  cancelEditingTransaction();

  monthFilter.value = getMonth(selectedDate);
  yearFilter.value = getYear(selectedDate);

  refreshDashboard();
}

async function deleteTransaction(id) {
  await apiDeleteTransaction(id);
  await refreshData();
  refreshDashboard();
}

function startEditingCategory(id) {
  const category = categoriesCache.find(item => item.id === id);
  if (!category) return;

  editingCategoryId = id;
  categoryNameInput.value = category.name;
  categoryKindInput.value = category.kind;
  categorySubmitBtn.textContent = "Guardar categoría";
  categoryCancelBtn.classList.remove("hidden");
}

function cancelEditingCategory() {
  editingCategoryId = null;
  categoryForm.reset();
  categorySubmitBtn.textContent = "Agregar categoría";
  categoryCancelBtn.classList.add("hidden");
}

async function addOrUpdateCategory(event) {
  event.preventDefault();

  const category = {
    name: categoryNameInput.value.trim(),
    kind: categoryKindInput.value
  };

  if (!category.name) return;

  try {
    if (editingCategoryId) {
      await apiUpdateCategory(editingCategoryId, category);
      alert("Categoría actualizada.");
    } else {
      await apiCreateCategory(category);
    }

    await refreshData();
    cancelEditingCategory();
    refreshDashboard();
  } catch (error) {
    alert(error.message);
  }
}

async function deleteCategory(id) {
  if (!confirm("¿Deseas eliminar esta categoría? Solo se puede eliminar si no tiene movimientos.")) return;

  try {
    await apiDeleteCategory(id);
    await refreshData();
    refreshDashboard();
  } catch (error) {
    alert(error.message);
  }
}

function exportJSON() {
  const data = {
    categories: categoriesCache,
    transactions: transactionsCache
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "db_export.json";
  link.click();

  URL.revokeObjectURL(url);
}

function showSection(sectionId) {
  sections.forEach(section => section.classList.remove("active-section"));
  navButtons.forEach(button => button.classList.remove("active"));

  document.getElementById(sectionId).classList.add("active-section");
  document.querySelector(`[data-section="${sectionId}"]`).classList.add("active");

  const titles = {
    transactionsSection: "Registrar movimientos",
    categoriesSection: "Categorías",
    chartsSection: "Gráficos",
    analyticsSection: "Data analytics"
  };

  pageTitle.textContent = titles[sectionId] || "Mi Balance";

  setTimeout(() => {
    renderMonthlyChartIn("monthlyChart", "monthly");
    renderMonthlyChartIn("chartsMonthlyChart", "chartsMonthly");
    renderCategoryReportChart();
    renderYearlyChart();
    renderExpenseTrendChart();
    renderAnalytics();
  }, 120);

  window.scrollTo({ top: 0, behavior: "smooth" });
}

navButtons.forEach(button => {
  button.addEventListener("click", () => showSection(button.dataset.section));
});

form.addEventListener("submit", addOrUpdateTransaction);
cancelEditBtn.addEventListener("click", cancelEditingTransaction);
typeInput.addEventListener("change", renderCategoryOptions);

categoryForm.addEventListener("submit", addOrUpdateCategory);
categoryCancelBtn.addEventListener("click", cancelEditingCategory);

monthlyDetailTable.addEventListener("click", event => {
  if (event.target.matches("button[data-edit-transaction-id]")) {
    startEditingTransaction(event.target.dataset.editTransactionId);
  }
});

transactionTable.addEventListener("click", event => {
  if (event.target.matches("button[data-delete-transaction-id]")) {
    const isSeries = event.target.textContent === "Eliminar serie";

    if (isSeries && !confirm("Este gasto fijo se eliminará de todos los meses. ¿Deseas continuar?")) return;

    deleteTransaction(event.target.dataset.deleteTransactionId);
  }
});

categoriesTable.addEventListener("click", event => {
  if (event.target.matches("button[data-edit-category-id]")) {
    startEditingCategory(event.target.dataset.editCategoryId);
  }

  if (event.target.matches("button[data-delete-category-id]")) {
    deleteCategory(event.target.dataset.deleteCategoryId);
  }
});

monthFilter.addEventListener("change", refreshDashboard);
yearFilter.addEventListener("change", refreshDashboard);
exportBtn.addEventListener("click", exportJSON);

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => refreshDashboard(), 250);
});

async function initApp() {
  dateInput.value = getCurrentDateValue();

  try {
    await refreshData();
    setupFilters();
    renderCategoryOptions();
    refreshDashboard();
  } catch (error) {
    alert("No se pudo iniciar la app. Ejecuta npm start y abre http://localhost:3000");
    console.error(error);
  }
}

initApp();

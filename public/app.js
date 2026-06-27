const form = document.getElementById("transactionForm");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const dateInput = document.getElementById("date");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const amountInput = document.getElementById("amount");
const descriptionInput = document.getElementById("description");

const monthFilter = document.getElementById("monthFilter");
const yearFilter = document.getElementById("yearFilter");

const totalIncomeEl = document.getElementById("totalIncome");
const totalFixedEl = document.getElementById("totalFixed");
const totalVariableEl = document.getElementById("totalVariable");
const savingsBalanceEl = document.getElementById("savingsBalance");
const transactionTable = document.getElementById("transactionTable");
const monthlyDetailTable = document.getElementById("monthlyDetailTable");
const exportBtn = document.getElementById("exportBtn");

let monthlyChart = null;
let yearlyChart = null;
let transactionsCache = [];
let editingTransactionId = null;

const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

async function apiGetTransactions() {
  const response = await fetch("/api/transactions");
  if (!response.ok) throw new Error("No se pudo leer db.json");
  return response.json();
}

async function apiCreateTransaction(transaction) {
  const response = await fetch("/api/transactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(transaction)
  });

  if (!response.ok) throw new Error("No se pudo guardar en db.json");
  return response.json();
}

async function apiUpdateTransaction(id, transaction) {
  const response = await fetch(`/api/transactions/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(transaction)
  });

  if (!response.ok) throw new Error("No se pudo actualizar db.json");
  return response.json();
}

async function apiDeleteTransaction(id) {
  const response = await fetch(`/api/transactions/${id}`, {
    method: "DELETE"
  });

  if (!response.ok) throw new Error("No se pudo eliminar de db.json");
  return response.json();
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-CA", {
    style: "currency",
    currency: "CAD"
  }).format(value);
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

  if (targetYear > start.year) return true;
  if (targetYear === start.year && targetMonth >= start.month) return true;

  return false;
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
  const selectedMonth = Number(monthFilter.value);
  const selectedYear = Number(yearFilter.value);

  return getTransactionsForMonth(selectedYear, selectedMonth);
}

function calculateTotals(transactions) {
  return transactions.reduce(
    (totals, item) => {
      if (item.type === "income") totals.income += item.amount;
      if (item.type === "fixed") totals.fixed += item.amount;
      if (item.type === "variable") totals.variable += item.amount;
      totals.savings = totals.income - totals.fixed - totals.variable;
      return totals;
    },
    { income: 0, fixed: 0, variable: 0, savings: 0 }
  );
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

  Array.from(years)
    .sort((a, b) => b - a)
    .forEach(year => {
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

  if (!years.has(selectedYear)) {
    years.add(selectedYear);
  }

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

function updateSummary() {
  const transactions = getFilteredTransactions();
  const totals = calculateTotals(transactions);

  totalIncomeEl.textContent = formatCurrency(totals.income);
  totalFixedEl.textContent = formatCurrency(totals.fixed);
  totalVariableEl.textContent = formatCurrency(totals.variable);
  savingsBalanceEl.textContent = formatCurrency(totals.savings);
}

function renderMonthlyDetailTable() {
  const transactions = getFilteredTransactions();
  const totals = calculateTotals(transactions);

  const detailRows = transactions.map(item => ({
    amount: item.amount,
    category: item.category,
    description: item.description || "-",
    type: item.type,
    originalId: item.originalId || item.id,
    isGeneratedFixed: Boolean(item.isGeneratedFixed)
  }));

  detailRows.push({
    amount: totals.savings,
    category: "Saldo restante",
    description: "Ahorro del mes",
    type: "savings",
    originalId: null,
    isGeneratedFixed: false
  });

  monthlyDetailTable.innerHTML = "";

  if (detailRows.length === 0) {
    monthlyDetailTable.innerHTML = `
      <tr>
        <td colspan="5">No hay información para mostrar.</td>
      </tr>
    `;
    return;
  }

  detailRows
    .sort((a, b) => {
      const order = { income: 1, fixed: 2, variable: 3, savings: 4 };
      return order[a.type] - order[b.type];
    })
    .forEach(item => {
      const row = document.createElement("tr");

      if (item.type === "income") row.classList.add("income-row");
      if (item.type === "fixed" || item.type === "variable") row.classList.add("expense-row");
      if (item.type === "savings") row.classList.add("savings-row");

      const actionButton = item.type === "fixed"
        ? `<button class="edit" data-edit-id="${item.originalId}">Editar</button>`
        : "-";

      row.innerHTML = `
        <td>${formatCurrency(item.amount)}</td>
        <td>${item.category}</td>
        <td>${item.description}</td>
        <td>${getTypeLabel(item.type)}</td>
        <td>${actionButton}</td>
      `;

      monthlyDetailTable.appendChild(row);
    });
}

function renderTable() {
  const transactions = getFilteredTransactions();
  transactionTable.innerHTML = "";

  if (transactions.length === 0) {
    transactionTable.innerHTML = `
      <tr>
        <td colspan="6">No hay movimientos registrados para este mes.</td>
      </tr>
    `;
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
        <td>${item.category}</td>
        <td>${description}</td>
        <td>${formatCurrency(item.amount)}</td>
        <td><button class="danger" data-id="${deleteId}">${deleteText}</button></td>
      `;

      transactionTable.appendChild(row);
    });
}

function renderMonthlyChart() {
  const transactions = getFilteredTransactions();
  const totals = calculateTotals(transactions);

  const ctx = document.getElementById("monthlyChart");

  if (monthlyChart) {
    monthlyChart.destroy();
  }

  monthlyChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Gastos fijos", "Gastos variables", "Ahorro"],
      datasets: [
        {
          data: [
            Math.max(totals.fixed, 0),
            Math.max(totals.variable, 0),
            Math.max(totals.savings, 0)
          ],
          backgroundColor: ["#dc2626", "#f97316", "#2563eb"]
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: context => `${context.label}: ${formatCurrency(context.raw)}`
          }
        }
      }
    }
  });
}

function getYearlyTotals() {
  const selectedYear = Number(yearFilter.value);

  return monthNames.map((month, monthIndex) => {
    const transactions = getTransactionsForMonth(selectedYear, monthIndex);
    const totals = calculateTotals(transactions);

    return {
      month,
      income: totals.income,
      fixed: totals.fixed,
      variable: totals.variable,
      savings: totals.savings
    };
  });
}

function renderYearlyChart() {
  const yearlyData = getYearlyTotals();
  const ctx = document.getElementById("yearlyChart");

  if (yearlyChart) {
    yearlyChart.destroy();
  }

  yearlyChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: yearlyData.map(item => item.month),
      datasets: [
        {
          label: "Ingresos",
          data: yearlyData.map(item => item.income),
          backgroundColor: "#16a34a"
        },
        {
          label: "Gastos fijos",
          data: yearlyData.map(item => item.fixed),
          backgroundColor: "#dc2626"
        },
        {
          label: "Gastos variables",
          data: yearlyData.map(item => item.variable),
          backgroundColor: "#f97316"
        },
        {
          label: "Ahorro",
          data: yearlyData.map(item => item.savings),
          backgroundColor: "#2563eb"
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: context => `${context.dataset.label}: ${formatCurrency(context.raw)}`
          }
        }
      }
    }
  });
}

function refreshDashboard() {
  setupYearFilterIfNeeded();
  updateSummary();
  renderMonthlyDetailTable();
  renderTable();
  renderMonthlyChart();
  renderYearlyChart();
}

function startEditingFixedExpense(id) {
  const transaction = transactionsCache.find(item => item.id === id);

  if (!transaction) return;

  editingTransactionId = id;

  dateInput.value = transaction.date;
  typeInput.value = "fixed";
  typeInput.disabled = true;
  categoryInput.value = transaction.category;
  amountInput.value = transaction.amount;
  descriptionInput.value = transaction.description || "";

  submitBtn.textContent = "Guardar cambios";
  cancelEditBtn.classList.remove("hidden");

  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function cancelEditing() {
  editingTransactionId = null;
  form.reset();
  dateInput.value = getCurrentDateValue();
  typeInput.disabled = false;
  submitBtn.textContent = "Agregar";
  cancelEditBtn.classList.add("hidden");
}

async function addOrUpdateTransaction(event) {
  event.preventDefault();

  const transaction = {
    date: dateInput.value,
    type: editingTransactionId ? "fixed" : typeInput.value,
    category: categoryInput.value.trim(),
    amount: Number(amountInput.value),
    description: descriptionInput.value.trim()
  };

  if (editingTransactionId) {
    await apiUpdateTransaction(editingTransactionId, transaction);
    alert("Gasto fijo recurrente actualizado en db.json. El cambio se aplicará a toda la serie.");
  } else {
    await apiCreateTransaction(transaction);

    if (transaction.type === "fixed") {
      alert("Gasto fijo guardado en db.json como recurrente. Se repetirá automáticamente todos los meses desde la fecha ingresada.");
    }
  }

  transactionsCache = await apiGetTransactions();

  const selectedDate = transaction.date;
  cancelEditing();

  monthFilter.value = getMonth(selectedDate);
  yearFilter.value = getYear(selectedDate);

  refreshDashboard();
}

async function deleteTransaction(id) {
  await apiDeleteTransaction(id);
  transactionsCache = await apiGetTransactions();
  refreshDashboard();
}

function exportJSON() {
  const data = {
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

form.addEventListener("submit", addOrUpdateTransaction);
cancelEditBtn.addEventListener("click", cancelEditing);

monthlyDetailTable.addEventListener("click", event => {
  if (event.target.matches("button[data-edit-id]")) {
    startEditingFixedExpense(event.target.dataset.editId);
  }
});

transactionTable.addEventListener("click", event => {
  if (event.target.matches("button[data-id]")) {
    const isSeries = event.target.textContent === "Eliminar serie";

    if (isSeries) {
      const confirmDelete = confirm("Este gasto fijo se eliminará de todos los meses. ¿Deseas continuar?");
      if (!confirmDelete) return;
    }

    deleteTransaction(event.target.dataset.id);
  }
});

monthFilter.addEventListener("change", refreshDashboard);
yearFilter.addEventListener("change", refreshDashboard);
exportBtn.addEventListener("click", exportJSON);

async function initApp() {
  dateInput.value = getCurrentDateValue();

  try {
    transactionsCache = await apiGetTransactions();
    setupFilters();
    refreshDashboard();
  } catch (error) {
    alert("No se pudo iniciar la app. Asegúrate de abrirla usando el servidor local con: npm start");
    console.error(error);
  }
}

initApp();

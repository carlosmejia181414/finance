
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DEFAULT_PORT = Number(process.env.PORT) || 3000;
const DB_PATH = path.join(__dirname, "db.json");
const PUBLIC_PATH = path.join(__dirname, "public");

const DEFAULT_DB = {
  categories: [
    { id: "cat_salary", name: "Salario", kind: "income" },
    { id: "cat_extra_income", name: "Ingreso extra", kind: "income" },
    { id: "cat_rent", name: "Renta", kind: "fixed" },
    { id: "cat_internet", name: "Internet", kind: "fixed" },
    { id: "cat_phone", name: "Celular", kind: "fixed" },
    { id: "cat_food", name: "Comida", kind: "variable" },
    { id: "cat_transport", name: "Transporte", kind: "variable" },
    { id: "cat_health", name: "Salud", kind: "variable" }
  ],
  transactions: []
};

function cloneDefaultDB() {
  return JSON.parse(JSON.stringify(DEFAULT_DB));
}

function writeDatabase(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
}

function readDatabaseRaw() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  } catch (error) {
    return cloneDefaultDB();
  }
}

function ensureDatabase() {
  if (!fs.existsSync(DB_PATH)) {
    writeDatabase(cloneDefaultDB());
    return;
  }

  const db = readDatabaseRaw();
  let changed = false;

  if (!Array.isArray(db.categories)) {
    db.categories = cloneDefaultDB().categories;
    changed = true;
  }

  if (!Array.isArray(db.transactions)) {
    db.transactions = [];
    changed = true;
  }

  db.transactions = db.transactions.map(transaction => {
    if (transaction.categoryId) return transaction;

    const kind = transaction.type || "variable";
    const categoryName = transaction.category || "Sin categoría";
    let category = db.categories.find(cat =>
      cat.name.toLowerCase() === categoryName.toLowerCase() &&
      cat.kind === kind
    );

    if (!category) {
      category = { id: crypto.randomUUID(), name: categoryName, kind };
      db.categories.push(category);
    }

    changed = true;
    return { ...transaction, categoryId: category.id };
  });

  if (changed) writeDatabase(db);
}

function readDatabase() {
  ensureDatabase();
  return readDatabaseRaw();
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, { "Content-Type": "application/json" });
  response.end(JSON.stringify(data));
}

function getRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", chunk => {
      body += chunk.toString();
    });

    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });

    request.on("error", reject);
  });
}

function serveStaticFile(request, response) {
  const requestedPath = request.url === "/" ? "/index.html" : request.url.split("?")[0];
  const safePath = path.normalize(requestedPath).replace(/^(\.\.[\/\\])+/, "");
  const filePath = path.join(PUBLIC_PATH, safePath);

  if (!filePath.startsWith(PUBLIC_PATH)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404);
      response.end("File not found");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const contentTypes = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "application/javascript",
      ".json": "application/json"
    };

    response.writeHead(200, {
      "Content-Type": contentTypes[extension] || "application/octet-stream"
    });

    response.end(content);
  });
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.url === "/api/db" && request.method === "GET") {
      sendJson(response, 200, readDatabase());
      return;
    }

    if (request.url === "/api/transactions" && request.method === "POST") {
      const transaction = await getRequestBody(request);
      const db = readDatabase();

      const newTransaction = {
        id: crypto.randomUUID(),
        date: transaction.date,
        type: transaction.type,
        categoryId: transaction.categoryId,
        amount: Number(transaction.amount),
        description: transaction.description || "",
        parentRecurringId: transaction.parentRecurringId || null,
        overrideYear: Number.isInteger(transaction.overrideYear) ? transaction.overrideYear : null,
        overrideMonth: Number.isInteger(transaction.overrideMonth) ? transaction.overrideMonth : null
      };

      db.transactions.push(newTransaction);
      writeDatabase(db);
      sendJson(response, 201, newTransaction);
      return;
    }

    if (request.url.startsWith("/api/transactions/") && request.method === "PUT") {
      const id = request.url.split("/").pop();
      const updates = await getRequestBody(request);
      const db = readDatabase();

      db.transactions = db.transactions.map(transaction => {
        if (transaction.id !== id) return transaction;

        return {
          ...transaction,
          date: updates.date,
          type: updates.type,
          categoryId: updates.categoryId,
          amount: Number(updates.amount),
          description: updates.description || "",
          parentRecurringId: updates.parentRecurringId || transaction.parentRecurringId || null,
          overrideYear: Number.isInteger(updates.overrideYear) ? updates.overrideYear : (Number.isInteger(transaction.overrideYear) ? transaction.overrideYear : null),
          overrideMonth: Number.isInteger(updates.overrideMonth) ? updates.overrideMonth : (Number.isInteger(transaction.overrideMonth) ? transaction.overrideMonth : null)
        };
      });

      writeDatabase(db);
      sendJson(response, 200, db.transactions.find(transaction => transaction.id === id));
      return;
    }

    if (request.url.startsWith("/api/transactions/") && request.method === "DELETE") {
      const id = request.url.split("/").pop();
      const db = readDatabase();

      db.transactions = db.transactions.filter(transaction => transaction.id !== id);

      writeDatabase(db);
      sendJson(response, 200, { success: true });
      return;
    }

    if (request.url === "/api/categories" && request.method === "POST") {
      const category = await getRequestBody(request);
      const db = readDatabase();

      if (!category.name || !category.name.trim() || !category.kind) {
        sendJson(response, 400, { error: "Debes ingresar nombre y tipo de categoría." });
        return;
      }

      category.name = category.name.trim();

      const exists = db.categories.some(cat =>
        cat.name.toLowerCase() === category.name.toLowerCase() &&
        cat.kind === category.kind
      );

      if (exists) {
        sendJson(response, 400, { error: "Ya existe una categoría con ese nombre y tipo." });
        return;
      }

      const newCategory = {
        id: crypto.randomUUID(),
        name: category.name,
        kind: category.kind
      };

      db.categories.push(newCategory);
      writeDatabase(db);
      sendJson(response, 201, newCategory);
      return;
    }

    if (request.url.startsWith("/api/categories/") && request.method === "PUT") {
      const id = request.url.split("/").pop();
      const updates = await getRequestBody(request);
      const db = readDatabase();

      if (!updates.name || !updates.name.trim() || !updates.kind) {
        sendJson(response, 400, { error: "Debes ingresar nombre y tipo de categoría." });
        return;
      }

      updates.name = updates.name.trim();

      const duplicate = db.categories.some(category =>
        category.id !== id &&
        category.name.toLowerCase() === updates.name.toLowerCase() &&
        category.kind === updates.kind
      );

      if (duplicate) {
        sendJson(response, 400, { error: "Ya existe otra categoría con ese nombre y tipo." });
        return;
      }

      db.categories = db.categories.map(category => {
        if (category.id !== id) return category;

        return {
          ...category,
          name: updates.name,
          kind: updates.kind
        };
      });

      db.transactions = db.transactions.map(transaction => {
        if (transaction.categoryId !== id) return transaction;
        return { ...transaction, type: updates.kind };
      });

      writeDatabase(db);
      sendJson(response, 200, db.categories.find(category => category.id === id));
      return;
    }

    if (request.url.startsWith("/api/categories/") && request.method === "DELETE") {
      const id = request.url.split("/").pop();
      const db = readDatabase();

      const isUsed = db.transactions.some(transaction => transaction.categoryId === id);

      if (isUsed) {
        sendJson(response, 400, {
          error: "No puedes eliminar esta categoría porque tiene movimientos registrados."
        });
        return;
      }

      db.categories = db.categories.filter(category => category.id !== id);
      writeDatabase(db);
      sendJson(response, 200, { success: true });
      return;
    }

    serveStaticFile(request, response);
  } catch (error) {
    sendJson(response, 500, {
      error: "Server error",
      detail: error.message
    });
  }
});

ensureDatabase();

function startServer(port, attempts = 0) {
  const maxAttempts = 20;

  server.once("error", error => {
    if (error.code === "EADDRINUSE" && attempts < maxAttempts) {
      const nextPort = port + 1;
      console.log("El puerto " + port + " está ocupado. Probando con el puerto " + nextPort + "...");
      startServer(nextPort, attempts + 1);
      return;
    }

    console.error("No se pudo iniciar el servidor:", error.message);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log("Servidor iniciado en http://localhost:" + port);
    console.log("Los datos se guardan en: " + DB_PATH);
  });
}

startServer(DEFAULT_PORT);

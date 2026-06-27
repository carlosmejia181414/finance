const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const DB_PATH = path.join(__dirname, "db.json");
const PUBLIC_PATH = path.join(__dirname, "public");

function ensureDatabase() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ transactions: [] }, null, 2), "utf8");
  }
}

function readDatabase() {
  ensureDatabase();

  try {
    const data = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return { transactions: [] };
  }
}

function writeDatabase(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
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
  const requestedPath = request.url === "/" ? "/index.html" : request.url;
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
    if (request.url === "/api/transactions" && request.method === "GET") {
      const db = readDatabase();
      sendJson(response, 200, db.transactions || []);
      return;
    }

    if (request.url === "/api/transactions" && request.method === "POST") {
      const transaction = await getRequestBody(request);
      const db = readDatabase();

      const newTransaction = {
        id: crypto.randomUUID(),
        date: transaction.date,
        type: transaction.type,
        category: transaction.category,
        amount: Number(transaction.amount),
        description: transaction.description || ""
      };

      db.transactions = db.transactions || [];
      db.transactions.push(newTransaction);

      writeDatabase(db);
      sendJson(response, 201, newTransaction);
      return;
    }


    if (request.url.startsWith("/api/transactions/") && request.method === "PUT") {
      const id = request.url.split("/").pop();
      const updates = await getRequestBody(request);
      const db = readDatabase();

      db.transactions = (db.transactions || []).map(transaction => {
        if (transaction.id !== id) return transaction;

        return {
          ...transaction,
          date: updates.date,
          type: updates.type,
          category: updates.category,
          amount: Number(updates.amount),
          description: updates.description || ""
        };
      });

      writeDatabase(db);
      const updatedTransaction = db.transactions.find(transaction => transaction.id === id);
      sendJson(response, 200, updatedTransaction);
      return;
    }

    if (request.url.startsWith("/api/transactions/") && request.method === "DELETE") {
      const id = request.url.split("/").pop();
      const db = readDatabase();

      db.transactions = (db.transactions || []).filter(transaction => transaction.id !== id);

      writeDatabase(db);
      sendJson(response, 200, { success: true });
      return;
    }

    if (request.url === "/api/export" && request.method === "GET") {
      const db = readDatabase();
      sendJson(response, 200, db);
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

server.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
  console.log(`Los datos se guardan en: ${DB_PATH}`);
});

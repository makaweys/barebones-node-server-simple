const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const router = require("./router");
const middleware = require("./middleware");

class AppServer {
  constructor(port = 3000) {
    this.port = port;
    this.routes = {};
    this.middleware = [];

    // Add built-in middleware
    this.use(middleware.logger);
    this.use(middleware.jsonParser);
    this.use(middleware.cors());
  }

  use(fn) {
    this.middleware.push(fn);
  }

  get(path, handler) {
    this.addRoute("GET", path, handler);
  }

  post(path, handler) {
    this.addRoute("POST", path, handler);
  }

  addRoute(method, path, handler) {
    if (!this.routes[method]) this.routes[method] = {};
    this.routes[method][path] = handler;
  }

  async handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    req.query = parsedUrl.query;
    req.pathname = parsedUrl.pathname;

    // Run middleware
    for (const mw of this.middleware) {
      const next = await mw(req, res);
      if (next === false) return;
    }

    // Serve static files
    if (req.method === "GET" && req.pathname.startsWith("/public/")) {
      return this.serveStatic(req, res);
    }

    // Find matching route
    const routeHandler = this.routes[req.method]?.[req.pathname];

    if (routeHandler) {
      try {
        await routeHandler(req, res);
      } catch (error) {
        this.sendError(res, 500, error.message);
      }
    } else {
      this.sendError(res, 404, `Route ${req.pathname} not found`);
    }
  }

  serveStatic(req, res) {
    const filePath = path.join(__dirname, req.pathname);

    // Security check
    if (!filePath.startsWith(path.join(__dirname, "public"))) {
      return this.sendError(res, 403, "Forbidden");
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        this.sendError(res, 404, "File not found");
        return;
      }

      const ext = path.extname(filePath);
      const mimeTypes = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "text/javascript",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
      };

      res.writeHead(200, {
        "Content-Type": mimeTypes[ext] || "text/plain",
      });
      res.end(data);
    });
  }

  sendError(res, status, message) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: message }));
  }

  start() {
    const server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    // Setup basic routes
    this.setupRoutes();

    server.listen(this.port, () => {
      console.log(`🚀 Server running at http://localhost:${this.port}`);
    });
  }

  setupRoutes() {
    // Home page
    this.get("/", (req, res) => {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Simple Node Server</title>
            <link rel="stylesheet" href="/public/style.css">
          </head>
          <body>
            <h1>Simple Node.js Core Server</h1>
            <p>No frameworks, just core modules!</p>
            <div class="links">
              <a href="/api/health">Health Check</a>
              <a href="/api/users">Users API</a>
              <a href="/api/echo">Echo Test</a>
            </div>
          </body>
        </html>
      `);
    });

    // API Routes
    this.get("/api/health", (req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ok",
          timestamp: new Date().toISOString(),
        }),
      );
    });

    this.get("/api/users", (req, res) => {
      const users = [
        { id: 1, name: "Onameous Varidis", email: "Onameous@example.com" },
        { id: 2, name: "Crixus Theodoros", email: "Crixus@example.com" },
      ];
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(users));
    });

    this.post("/api/users", async (req, res) => {
      const user = req.body;
      user.id = Date.now();
      user.created = new Date().toISOString();

      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify(user));
    });

    this.post("/api/echo", async (req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          received: req.body,
          timestamp: new Date().toISOString(),
        }),
      );
    });
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new AppServer(3000);
  server.start();
}

module.exports = AppServer;

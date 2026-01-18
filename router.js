class AppRouter {
  constructor() {
    this.routes = {
      GET: {},
      POST: {},
      PUT: {},
      DELETE: {},
    };
  }

  add(method, path, handler) {
    this.routes[method.toUpperCase()][path] = handler;
  }

  get(path, handler) {
    this.add("GET", path, handler);
  }

  post(path, handler) {
    this.add("POST", path, handler);
  }

  match(method, path) {
    return this.routes[method]?.[path] || null;
  }

  async handle(req, res) {
    const handler = this.match(req.method, req.url);

    if (handler) {
      try {
        await handler(req, res);
      } catch (error) {
        console.error("Handler error:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
    }
  }
}

module.exports = AppRouter;

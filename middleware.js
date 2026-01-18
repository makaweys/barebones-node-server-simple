function logger(req, res) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  return true;
}

function jsonParser(req, res) {
  return new Promise((resolve) => {
    if (req.method === "POST" || req.method === "PUT") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        try {
          req.body = body ? JSON.parse(body) : {};
        } catch {
          req.body = {};
        }
        resolve(true);
      });
    } else {
      resolve(true);
    }
  });
}
// CORS
function cors(options = {}) {
  const origins = options.origins || ["http://localhost:3000"];

  return function (req, res) {
    const origin = req.headers.origin;

    // Allow preflight requests
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": origins.includes(origin)
          ? origin
          : origins[0],
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      });
      res.end();
      return false;
    }

    // Add CORS headers
    if (origins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }

    return true;
  };
}

// Rate limiting
function rateLimit(max = 100, windowMs = 60000) {
  const requests = {};

  setInterval(() => {
    const now = Date.now();
    Object.keys(requests).forEach((ip) => {
      requests[ip] = requests[ip].filter((time) => now - time < windowMs);
      if (requests[ip].length === 0) delete requests[ip];
    });
  }, windowMs);

  return function (req, res) {
    const ip = req.socket.remoteAddress;

    if (!requests[ip]) requests[ip] = [];

    const recent = requests[ip].filter((time) => Date.now() - time < windowMs);

    if (recent.length >= max) {
      res.writeHead(429, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Too many requests" }));
      return false;
    }

    requests[ip].push(Date.now());
    return true;
  };
}

module.exports = {
  logger,
  jsonParser,
  cors,
  rateLimit,
};

// src/middleware/logger.js
exports.requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.connection.remoteAddress;

  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);

  // Log when response is finished
  res.on("finish", () => {
    const status = res.statusCode;
    console.log(`[${timestamp}] ${method} ${url} - Status: ${status}`);
  });

  next();
};

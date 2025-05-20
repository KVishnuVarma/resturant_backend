const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const { Server } = require("socket.io");
const http = require("http");

const config = require("./config");
const logger = require("./utils/logger");

// Routes
const authRoute = require("./routes/auth");
const chatRoute = require("./routes/chatbot");
const menuRoute = require("./routes/menu");
const orderRoute = require("./routes/orderRoutes");
const reservationRoute = require("./routes/reservationRoutes");
const paymentRoute = require("./routes/paymentRoutes");
const deliveryBoyRoute = require("./routes/deliveryBoyRoutes");

const app = express();

// Import middleware
const { apiLimiter, authLimiter, chatbotLimiter } = require('./middleware/rateLimiter');

// Security Middleware
// Production-grade security middleware
app.use(helmet({
  contentSecurityPolicy: true,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  dnsPrefetchControl: true,
  frameguard: true,
  hidePoweredBy: true,
  hsts: true,
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: true,
  referrerPolicy: true,
  xssFilter: true
}));

// Production CORS settings
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Optimize response size
app.use(compression());

// Production logging
app.use(morgan('[:date[iso]] ":method :url" :status :response-time ms - :res[content-length]', { 
  stream: logger.stream,
  skip: (req, res) => res.statusCode < 400 // Only log errors in production
}));
app.use(express.json({ limit: '10kb' })); // Body parser with size limit
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// Apply rate limiting to routes
app.use("/api/auth", authLimiter, authRoute);
app.use("/api/chatbot", chatbotLimiter, chatRoute);
app.use("/api/menu", apiLimiter, menuRoute);
app.use("/api/orders", apiLimiter, orderRoute);
app.use("/api/reservations", apiLimiter, reservationRoute);
app.use("/api/payments", apiLimiter, paymentRoute);
app.use("/api/delivery-boys", apiLimiter, deliveryBoyRoute);

// Root endpoint
app.get("/", (_, res) => res.send("🚀 Real-Time Restaurant Server is running"));

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.IO Manager
const socketManager = require('./utils/socketManager');
socketManager.initialize(server);

// Function to find an available port
const findAvailablePort = async (startPort) => {
  const net = require('net');
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
  });
};

// Graceful shutdown handling
const gracefulShutdown = () => {
  logger.info('Received shutdown signal. Starting graceful shutdown...');
  server.close(() => {
    logger.info('HTTP server closed.');
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed.');
      process.exit(0);
    });
  });
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  gracefulShutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  gracefulShutdown();
});

// MongoDB + Server Boot
mongoose.connect(config.mongoUri)
  .then(async () => {
    console.log("✅ MongoDB Connected Successfully");
    
    const port = config.port;
    server.listen(port, () => {
      console.log(`🚀 Server listening on port ${port}`);
    });
}).catch((err) => {
  console.error("❌ MongoDB Connection Failed:", err);
  process.exit(1);
});

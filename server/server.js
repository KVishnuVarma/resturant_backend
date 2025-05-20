const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const { Server } = require("socket.io");
const http = require("http");

// Load environment variables
dotenv.config();

// Routes
const authRoute = require("./routes/auth");
const chatRoute = require("./routes/chatbot");
const menuRoute = require("./routes/menu");
const orderRoute = require("./routes/orderRoutes");
const reservationRoute = require("./routes/reservationRoutes");
const paymentRoute = require("./routes/paymentRoutes");
const deliveryBoyRoute = require("./routes/deliveryBoyRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Route middlewares
app.use("/api/auth", authRoute);
app.use("/api/chatbot", chatRoute);
app.use("/api/menu", menuRoute);
app.use("/api/orders", orderRoute);
app.use("/api/reservations", reservationRoute);
app.use("/api/payments", paymentRoute);
app.use("/api/delivery-boys", deliveryBoyRoute);

// Root endpoint
app.get("/", (_, res) => res.send("🚀 Real-Time Restaurant Server is running"));

// Create HTTP Server
const server = http.createServer(app);

// Socket.IO Setup
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on("connection", (socket) => {
  console.log("🟢 New socket connected:", socket.id);

  socket.on("send_message", (data) => {
    socket.broadcast.emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

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

// MongoDB + Server Boot
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log("✅ MongoDB Connected");
  
  const desiredPort = process.env.PORT || 5000;
  const port = await findAvailablePort(desiredPort);
  
  server.listen(port, () => {
    console.log(`🚀 Server listening on port ${port}`);
  });
}).catch((err) => {
  console.error("❌ MongoDB Connection Failed:", err);
});

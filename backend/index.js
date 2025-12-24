import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { sequelize, connectDB } from "./DB/DBconnection.js";

// Load environment variables from .env file
dotenv.config();

// Import models to register them with Sequelize
import "./models/userModel.js";
import "./models/fileModel.js";
import "./models/exEmployeeModel.js";
import "./models/payrollModel.js";
import "./models/hrUsers.js";

// Import API routes
import userRoutes from "./routes/userRoute.js";
import fileRoutes from "./routes/fileRoute.js";
import authRoutes from "./routes/authRoute.js";
import exEmployeeRoutes from "./routes/exEmployeeRoute.js";
import payrollRoutes from "./routes/payrollRoute.js";
import taskRoutes from "./routes/taskRoute.js";
import attendanceRoutes from "./routes/attendanceRoute.js";

// Initialize Express app
const app = express();

// Configure CORS (Cross-Origin Resource Sharing) options
const corsOptions = {
  // FIXME: Change this to the frontend URL once go live
  origin: "*", // Allow all frontend URL temporarily
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], // Allowed HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Handle preflight requests

// Middleware to parse request bodies
app.use(express.json({ limit: "50mb" })); // Parse JSON bodies with a size limit
app.use(express.urlencoded({ limit: "50mb", extended: true })); // Parse URL-encoded bodies

// Register API routes
app.use("/api/users", userRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/exemployees", exEmployeeRoutes);
app.use("/api/payrolls", payrollRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/attendance", attendanceRoutes);

// Root endpoint (to check if the backend is running)
app.get("/", (req, res) => {
  res.send("MERN Backend with PostgreSQL is Running...");
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  try {
    await connectDB(); // Connect to the PostgreSQL database
    console.log(`🚀 Server running on port ${PORT}`);
  } catch (error) {
    console.error("Failed to start server:", error);
  }
});

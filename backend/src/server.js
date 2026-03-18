import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";

dotenv.config();

// 🔥 Handle uncaught exceptions (sync errors)
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err.message);
  process.exit(1);
});

// 🔌 Connect MongoDB
await connectDB();

const PORT = process.env.PORT

// 🚀 Start server
const server = app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});

// 🔥 Handle unhandled promise rejections (async errors)
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err.message);
  server.close(() => {
    process.exit(1);
  });
});
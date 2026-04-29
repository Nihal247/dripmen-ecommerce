import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";

// Global Error Boundary for Uncaught Exceptions
process.on("uncaughtException", (err) => {
  console.error("🔥 Uncaught Exception! Shutting down...");
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});


await connectDB();

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});


// Global Error Boundary for Unhandled Promise Rejections
process.on("unhandledRejection", (err) => {
  console.error("🔥 Unhandled Rejection! Shutting down...");
  console.error(err.name, err.message);
  console.error(err.stack);
  server.close(() => {
    process.exit(1);
  });
});
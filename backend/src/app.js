import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";

const app = express();

// ==============================
// ✅ GLOBAL MIDDLEWARES
// ==============================

// enable CORS (important for frontend)
app.use(cors());

// parse JSON body
app.use(express.json());

// ==============================
// ✅ ROUTES
// ==============================

// auth routes
app.use("/api/auth", userRoutes);

// health check route (optional but useful)
app.get("/", (req, res) => {
  res.send("🚀 DripMen API is running...");
});

// ==============================
// ✅ 404 HANDLER (optional pro)
// ==============================
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

export default app;
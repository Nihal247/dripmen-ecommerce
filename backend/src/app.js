import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";

import passport from "./config/passportConfig.js";

const app = express();

// Trust proxy for secure cookies and correct protocol resolution behind load balancers/proxies (e.g., Render)
app.set("trust proxy", 1);

// Security Headers
app.use(helmet({ crossOriginResourcePolicy: false }));

// enable CORS with specific origins (important for security)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5500",
  "http://127.0.0.1:5500"
];

const isLocalhostDynamicPort = (origin) => {
  return /^http:\/\/(localhost|127\.0\.0\.1):550[0-9]$/.test(origin);
};

const isNetlifyOrigin = (origin) => {
  return /\.netlify\.app$/.test(origin);
};

const isVercelOrigin = (origin) => {
  return /\.vercel\.app$/.test(origin);
};

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || isLocalhostDynamicPort(origin) || isNetlifyOrigin(origin) || isVercelOrigin(origin)) {
      callback(null, true);
    } else {
      console.error("CORS Error: Origin not allowed ->", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  message: { success: false, message: "Too many requests from this IP, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});
// Apply global limiter to all API routes
app.use("/api", globalLimiter);



app.use(passport.initialize());



// ==============================



// parse JSON body
app.use(express.json());


// ==============================
// ✅ ROUTES
// ==============================

// auth routes
app.use("/api/auth", userRoutes);

// admin routes
app.use("/api/admin", adminRoutes);

// category routes
app.use("/api/categories", categoryRoutes);

// product routes
app.use("/api/products", productRoutes);

// cart routes
app.use("/api/cart", cartRoutes);

// order routes
app.use("/api/orders", orderRoutes);

// wishlist routes
app.use("/api/wishlist", wishlistRoutes);

// wallet routes
app.use("/api/wallet", walletRoutes);

// payment routes

app.use("/api/payment", paymentRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/reviews", reviewRoutes);

// ==============================

// health check route (optional but useful)
app.get("/", (req, res) => {
  res.send("🚀 DripMen API is running...");
});

// ==============================
// ✅ 404 HANDLER
// ==============================
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ==============================
// ✅ GLOBAL ERROR HANDLER
// ==============================
app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {}
  });
});

export default app;
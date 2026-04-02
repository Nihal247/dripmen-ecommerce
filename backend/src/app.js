import express from "express";
import cors from "cors";
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

// payment routes

app.use("/api/payment", paymentRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/banners", bannerRoutes);

// ==============================

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
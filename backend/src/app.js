import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
<<<<<<< HEAD
import paymentRoutes from "./routes/paymentRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";

import passport from "./config/passportConfig.js";
=======

>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920

const app = express();




app.use(passport.initialize());



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

<<<<<<< HEAD
// wallet routes
app.use("/api/wallet", walletRoutes);

// payment routes

app.use("/api/payment", paymentRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/reviews", reviewRoutes);

=======
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
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
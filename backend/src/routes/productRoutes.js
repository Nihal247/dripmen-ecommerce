import express from "express";
// import { createProduct } from "../controllers/productController.js"; // ⏳ build this later
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

// router.post("/", protect, adminOnly, createProduct); // ⏳ uncomment later

export default router;
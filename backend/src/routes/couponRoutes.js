import express from "express";
import {
  createCoupon,
  getAllCoupons,
  getAvailableCoupons,
  deleteCoupon,
  updateCoupon,
  applyCoupon
} from "../controllers/couponController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

// Public Route
router.get("/available", getAvailableCoupons);

// User Route
router.post("/apply", protect, applyCoupon);

// Admin Routes
router.get("/",       protect, adminOnly, getAllCoupons);
router.post("/",      protect, adminOnly, createCoupon);
router.put("/:id",    protect, adminOnly, updateCoupon);
router.delete("/:id", protect, adminOnly, deleteCoupon);

export default router;

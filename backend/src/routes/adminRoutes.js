import express from "express";
import rateLimit from "express-rate-limit";
import {
  adminLogin,
  getAllUsers,
  toggleBlockUser,
  getUserDetails,
  getDashboardStats,
  getSalesReport,
  getNotifications,
  getAllTransactions
} from "../controllers/adminController.js";

import { protect }   from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 admin login attempts per window
  message: { success: false, message: "Too many login attempts, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", adminAuthLimiter, adminLogin);

// Dashboard
router.get("/stats",              protect, adminOnly, getDashboardStats);
router.get("/sales-report",       protect, adminOnly, getSalesReport);
router.get("/notifications",      protect, adminOnly, getNotifications);
router.get("/transactions",       protect, adminOnly, getAllTransactions);

// user management
router.get("/users",              protect, adminOnly, getAllUsers);
router.get("/users/:id/details",  protect, adminOnly, getUserDetails);
router.put("/users/:id/block",    protect, adminOnly, toggleBlockUser);

export default router;
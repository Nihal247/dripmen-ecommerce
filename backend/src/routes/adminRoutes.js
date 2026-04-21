import express from "express";
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

router.post("/login", adminLogin);

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
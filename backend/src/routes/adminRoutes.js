import express from "express";
import {
  adminLogin,
  getAllUsers,
  toggleBlockUser,
<<<<<<< HEAD
  deleteUser,
  getDashboardStats,
  getSalesReport,
  getNotifications,
  getAllTransactions
=======
  deleteUser
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
} from "../controllers/adminController.js";

import { protect }   from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/login", adminLogin);

<<<<<<< HEAD
// Dashboard
router.get("/stats",              protect, adminOnly, getDashboardStats);
router.get("/sales-report",       protect, adminOnly, getSalesReport);
router.get("/notifications",      protect, adminOnly, getNotifications);
router.get("/transactions",       protect, adminOnly, getAllTransactions);

=======
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
// user management
router.get("/users",              protect, adminOnly, getAllUsers);
router.put("/users/:id/block",    protect, adminOnly, toggleBlockUser);
router.delete("/users/:id",       protect, adminOnly, deleteUser);

export default router;
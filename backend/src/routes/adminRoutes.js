import express from "express";
import {
  adminLogin,
  getAllUsers,
  toggleBlockUser,
  deleteUser,
  getDashboardStats
} from "../controllers/adminController.js";

import { protect }   from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/login", adminLogin);

// Dashboard
router.get("/stats",              protect, adminOnly, getDashboardStats);

// user management
router.get("/users",              protect, adminOnly, getAllUsers);
router.put("/users/:id/block",    protect, adminOnly, toggleBlockUser);
router.delete("/users/:id",       protect, adminOnly, deleteUser);

export default router;
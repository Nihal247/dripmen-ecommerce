import express from "express";
import {
  adminLogin,
  getAllUsers,
  toggleBlockUser,
  deleteUser
} from "../controllers/adminController.js";

import { protect }   from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/login", adminLogin);

// user management
router.get("/users",              protect, adminOnly, getAllUsers);
router.put("/users/:id/block",    protect, adminOnly, toggleBlockUser);
router.delete("/users/:id",       protect, adminOnly, deleteUser);

export default router;
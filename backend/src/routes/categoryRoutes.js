import express from "express";
import {
  createCategory,
  getAllCategories,
  getAdminCategories,
  updateCategory,
<<<<<<< HEAD
  toggleCategoryStatus,
  deleteCategory,
=======
toggleCategoryStatus,
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
} from "../controllers/categoryController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

// ==============================
// PUBLIC ROUTES
// ==============================
router.get("/", getAllCategories);

// ==============================
// ADMIN ROUTES
// ==============================
router.get("/admin", protect, adminOnly, getAdminCategories);
router.post("/", protect, adminOnly, upload.single("image"), createCategory);
router.put("/:id", protect, adminOnly, upload.single("image"), updateCategory);
router.patch("/:id/toggle", protect, adminOnly, toggleCategoryStatus);
router.delete("/:id", protect, adminOnly, deleteCategory);

export default router;
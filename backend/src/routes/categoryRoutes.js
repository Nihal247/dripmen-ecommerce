import express from "express";
import {
  createCategory,
  getAllCategories,
  getAdminCategories,
  updateCategory,
toggleCategoryStatus,
} from "../controllers/categoryController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

// ==============================
// PUBLIC ROUTES
// ==============================
// Why no protect: any user (even not logged in) can see categories
// needed for filter buttons on products page
router.get("/", getAllCategories);

// ==============================
// ADMIN ROUTES
// ==============================
// Why protect + adminOnly: only logged in admins can
// create, edit or toggle categories
router.get("/admin", protect, adminOnly, getAdminCategories);

// Why upload.single("image"): admin uploads ONE image per category
// "image" must match the form field name in your admin HTML
router.post("/", protect, adminOnly, upload.single("image"), createCategory);

router.put("/:id", protect, adminOnly, upload.single("image"), updateCategory);

// Why separate route for toggle: it only changes status field
// no image upload needed so no upload middleware
router.patch("/:id/toggle", protect, adminOnly, toggleCategoryStatus);

export default router;
import express from "express";
import {
  createBanner,
  getAdminBanners,
  getPublicBanners,
  updateBanner,
  deleteBanner
} from "../controllers/bannerController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

// Public Routes
router.get("/", getPublicBanners);

// Admin Routes
router.get("/admin",  protect, adminOnly, getAdminBanners);
router.post("/",      protect, adminOnly, upload.single("image"), createBanner);
router.put("/:id",    protect, adminOnly, upload.single("image"), updateBanner);
router.delete("/:id", protect, adminOnly, deleteBanner);

export default router;

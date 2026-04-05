import express from "express";
import {
  createBanner,
  getAdminBanners,
  getPublicBanners,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
  recordClick,
  recordView
} from "../controllers/bannerController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { uploadBanner } from "../middleware/upload.js";

const router = express.Router();

// Public Routes
router.get("/", getPublicBanners);
router.post("/:id/click", recordClick);
router.post("/:id/view", recordView);

// Admin Routes
router.get("/admin",  protect, adminOnly, getAdminBanners);
router.post("/",      protect, adminOnly, uploadBanner.single('image'), createBanner);
router.put("/:id",    protect, adminOnly, uploadBanner.single('image'), updateBanner);
router.patch("/:id/status", protect, adminOnly, toggleBannerStatus);
router.delete("/:id", protect, adminOnly, deleteBanner);

export default router;

import express from "express";
import {
  createProduct,
  getAdminProducts,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  getPriceRange,
  getHomepageData
} from "../controllers/productController.js";

import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

// ==============================
// ADMIN ROUTES
// ==============================

// get all products for admin
router.get("/admin/all", protect, adminOnly, getAdminProducts);

// create product
router.post("/", protect, adminOnly, upload.array("images", 5), createProduct);

// update product
router.put("/:id", protect, adminOnly, upload.array("images", 5), updateProduct);

// update product status
router.patch("/:id/status", protect, adminOnly, updateProductStatus);

// delete product
router.delete("/:id", protect, adminOnly, deleteProduct);


// ==============================
// PUBLIC ROUTES
// ==============================

// get homepage consolidated data
router.get("/homepage", getHomepageData);

// get products for users
router.get("/", getProducts);

// get price range
router.get("/price-range", getPriceRange);

// get single product
router.get("/:id", getProductById);

export default router;
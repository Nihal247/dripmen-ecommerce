import express from "express";
import {
  createProduct,
  getAdminProducts,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
<<<<<<< HEAD
  updateProductStatus,
  getPriceRange
=======
  updateProductStatus
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
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

// get products for users
router.get("/", getProducts);

<<<<<<< HEAD
// get price range
router.get("/price-range", getPriceRange);

=======
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
// get single product
router.get("/:id", getProductById);

export default router;
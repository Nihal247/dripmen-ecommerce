import express from "express";
import {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
} from "../controllers/cartController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// all routes are protected (user must login)
router.post("/", protect, addToCart);
router.get("/", protect, getCart);
router.put("/:productId", protect, updateCartItem);
router.delete("/:productId", protect, removeCartItem);

export default router;
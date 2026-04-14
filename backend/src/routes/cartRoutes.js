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
<<<<<<< HEAD
router.put("/:itemId", protect, updateCartItem);
router.delete("/:itemId", protect, removeCartItem);
=======
router.put("/:productId", protect, updateCartItem);
router.delete("/:productId", protect, removeCartItem);
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920

export default router;
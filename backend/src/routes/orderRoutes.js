import express from "express";
import {
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus
} from "../controllers/orderController.js";

import { protect }   from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

// user routes
router.post("/",          protect, placeOrder);
router.get("/my-orders",  protect, getMyOrders);
router.get("/:id",        protect, getOrderById);
router.put("/:id/cancel", protect, cancelOrder);

// admin routes
router.get("/admin/all",        protect, adminOnly, getAllOrders);
router.put("/admin/:id/status", protect, adminOnly, updateOrderStatus);

export default router;
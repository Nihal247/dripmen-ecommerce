import express from "express";
import {
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  requestReturn,
  approveReturn,
  rejectReturn
} from "../controllers/orderController.js";

import { protect }   from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

// user routes
router.post("/",          protect, placeOrder);
router.get("/my-orders",  protect, getMyOrders);

router.get("/:id",        protect, getOrderById);
router.patch("/:id/return", protect, requestReturn);
router.put("/:id/cancel", protect, cancelOrder);

// admin routes
router.get("/admin/all",        protect, adminOnly, getAllOrders);
router.put("/admin/:id/status", protect, adminOnly, updateOrderStatus);
router.patch("/admin/:id/approve-return", protect, adminOnly, approveReturn);
router.patch("/admin/:id/reject-return", protect, adminOnly, rejectReturn);

export default router;
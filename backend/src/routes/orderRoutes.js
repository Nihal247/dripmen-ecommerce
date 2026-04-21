import express from "express";
import {
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelOrderItem,
  getAllOrders,
  updateOrderStatus,
  requestReturnItem,
  approveReturnItem,
  rejectReturnItem,
  cancelOrder,
  adminGetOrderById,
  adminUpdateOrderItemStatus
} from "../controllers/orderController.js";

import { protect }   from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

// user routes
router.post("/",          protect, placeOrder);
router.get("/my-orders",  protect, getMyOrders);
router.get("/:id",        protect, getOrderById);

// Item-level actions (User)
router.post("/cancel-item", protect, cancelOrderItem);
router.put("/:id/cancel", protect, cancelOrder);
router.post("/return-item-request", protect, requestReturnItem);

// admin routes
router.get("/admin/all",        protect, adminOnly, getAllOrders);
router.get("/admin/:id",        protect, adminOnly, adminGetOrderById);
router.put("/admin/:id/status", protect, adminOnly, updateOrderStatus);

// Item-level actions (Admin)
router.put("/admin/:orderId/item/:itemId/status", protect, adminOnly, adminUpdateOrderItemStatus);
router.post("/admin/approve-return-item", protect, adminOnly, approveReturnItem);
router.post("/admin/reject-return-item",  protect, adminOnly, rejectReturnItem);

export default router;
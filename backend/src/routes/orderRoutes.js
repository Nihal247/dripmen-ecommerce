import express from "express";
import {
  placeOrder,
  getMyOrders,
  getOrderById,
<<<<<<< HEAD
  cancelOrderItem,
  getAllOrders,
  updateOrderStatus,
  requestReturnItem,
  approveReturnItem,
  rejectReturnItem,
  cancelOrder
=======
  cancelOrder,
  getAllOrders,
  updateOrderStatus
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
} from "../controllers/orderController.js";

import { protect }   from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

// user routes
router.post("/",          protect, placeOrder);
router.get("/my-orders",  protect, getMyOrders);
<<<<<<< HEAD
router.get("/:id",        protect, getOrderById);

// Item-level actions (User)
router.post("/cancel-item", protect, cancelOrderItem);
router.put("/:id/cancel", protect, cancelOrder);
router.post("/return-item-request", protect, requestReturnItem);
=======
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920

// admin routes
router.get("/admin/all",        protect, adminOnly, getAllOrders);
router.put("/admin/:id/status", protect, adminOnly, updateOrderStatus);

<<<<<<< HEAD
// Item-level actions (Admin)
router.post("/admin/approve-return-item", protect, adminOnly, approveReturnItem);
router.post("/admin/reject-return-item",  protect, adminOnly, rejectReturnItem);
=======
router.get("/:id",        protect, getOrderById);
router.put("/:id/cancel", protect, cancelOrder);
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920

export default router;
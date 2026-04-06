import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getWallet, createWallet, addMoney, verifyPayment } from "../controllers/walletController.js";

const router = express.Router();

router.get("/", protect, getWallet);
router.post("/create", protect, createWallet);
router.post("/add-money", protect, addMoney);
router.post("/verify-payment", protect, verifyPayment);

export default router;

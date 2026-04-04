import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getWallet, createTopupOrder, verifyTopup } from "../controllers/walletController.js";

const router = express.Router();

router.get("/", protect, getWallet);
router.post("/topup", protect, createTopupOrder);
router.post("/verify", protect, verifyTopup);

export default router;

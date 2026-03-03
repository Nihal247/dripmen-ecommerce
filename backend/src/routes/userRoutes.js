import express from "express";
import { sendSignupOtp, verifySignupOtp } from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", sendSignupOtp);
router.post("/verify-signup-otp", verifySignupOtp);

export default router;
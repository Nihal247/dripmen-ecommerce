import express from "express";
import {
  sendSignupOtp,
  verifySignupOtp,
  loginUser,
} from "../controllers/authController.js";

const router = express.Router();

// ==============================
// ✅ AUTH ROUTES
// ==============================

// send OTP
router.post("/signup-otp", sendSignupOtp);

// verify OTP + create user
router.post("/verify-signup-otp", verifySignupOtp);

// login
router.post("/login", loginUser);

export default router;
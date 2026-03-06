import express from "express";
import { sendSignupOtp, verifySignupOtp,loginUser,getCurrentUser,forgotPassword,
  resetPassword} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";


const router = express.Router();

router.post("/signup", sendSignupOtp);
router.post("/verify-signup-otp", verifySignupOtp);
router.post("/login", loginUser);
router.get("/me", protect, getCurrentUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
export default router;
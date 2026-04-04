import express from "express";
import { sendSignupOtp, verifySignupOtp,loginUser,getCurrentUser,forgotPassword,
  resetPassword,updateProfile,changePassword } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import passport from "passport";
import generateToken from "../utils/generateToken.js";



const router = express.Router();

router.post("/signup", sendSignupOtp);
router.post("/verify-signup-otp", verifySignupOtp);
router.post("/login", loginUser);
router.get("/me", protect, getCurrentUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.put("/update-profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

// ==============================
// ✅ GOOGLE AUTH ROUTES
// ==============================

// @desc    Auth with Google
// @route   GET /api/auth/google
router.get(
  "/google",
  (req, res, next) => {
    console.log("[DEBUG] Initiating Google Auth with Redirect URI:", process.env.GOOGLE_CALLBACK_URL);
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

// @desc    Google auth callback
// @route   GET /api/auth/google/callback
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login", session: false }),
  (req, res) => {
    // Succesful authentication
    const token = generateToken(req.user._id, req.user.isAdmin || false);
    
    // Redirect to frontend with token
    const frontendUrl = `http://127.0.0.1:5500/Public/User/login.html?token=${token}`;
    res.redirect(frontendUrl);
  }
);

export default router;
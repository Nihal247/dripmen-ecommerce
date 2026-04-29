import express from "express";
import rateLimit from "express-rate-limit";
import { sendSignupOtp, verifySignupOtp,loginUser,getCurrentUser,forgotPassword,
  resetPassword,updateProfile,changePassword } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import passport from "passport";
import generateToken from "../utils/generateToken.js";



const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per window
  message: { success: false, message: "Too many attempts, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/signup", authLimiter, sendSignupOtp);
router.post("/verify-signup-otp", authLimiter, verifySignupOtp);
router.post("/login", authLimiter, loginUser);
router.get("/me", protect, getCurrentUser);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
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
    // Capture the origin from query param or referer to redirect back properly
    const origin = req.query.origin || req.headers.referer || process.env.FRONTEND_URL || "http://127.0.0.1:5500";
    console.log("[DEBUG] Initiating Google Auth, Target Origin:", origin);
    
    // Pass the origin in the 'state' parameter
    passport.authenticate("google", { 
      scope: ["profile", "email"], 
      session: false,
      state: origin 
    })(req, res, next);
  }
);

// @desc    Google auth callback
// @route   GET /api/auth/google/callback
router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", { session: false }, (err, user, info) => {
      // Get the origin or target URL back from the state parameter
      const state = req.query.state || process.env.FRONTEND_URL || "http://127.0.0.1:5500";
      
      if (err) {
        console.error("Google Auth Error:", err);
        return res.redirect(`${state}/login.html?error=auth_failed`);
      }
      if (!user) {
        console.error("Google Auth failed: No user returned.", info);
        return res.redirect(`${state}/login.html?error=user_not_found`);
      }

      if (user.isBlocked) {
        console.error("Google Auth failed: User is blocked.");
        return res.redirect(`${state}/login.html?error=account_suspended`);
      }

      const token = generateToken(user._id, user.isAdmin || false);
      
      let frontendUrl;
      if (state.includes('.html')) {
        frontendUrl = `${state}?token=${token}`;
      } else {
        const cleanOrigin = state.endsWith('/') ? state.slice(0, -1) : state;
        // Point to root index.html
        frontendUrl = `${cleanOrigin}/index.html?token=${token}`;
      }
      
      res.redirect(frontendUrl);
    })(req, res, next);
  }
);

export default router;
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

<<<<<<< HEAD
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
    console.log("[DEBUG] Initiating Google Auth with Redirect URI:", process.env.GOOGLE_CALLBACK_URL, "Target Origin:", origin);
    
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
      // Get the origin back from the state parameter
      const origin = req.query.state || process.env.FRONTEND_URL || "http://127.0.0.1:5500";
      
      // Ensure origin doesn't end with a slash for consistency
      const cleanOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;

      if (err) {
        console.error("Google Auth Error:", err);
        return res.redirect(`${cleanOrigin}/Public/User/login.html?error=auth_failed`);
      }
      if (!user) {
        console.error("Google Auth failed: No user returned.", info);
        return res.redirect(`${cleanOrigin}/Public/User/login.html?error=user_not_found`);
      }

      const token = generateToken(user._id, user.isAdmin || false);
      
      const frontendUrl = `${cleanOrigin}/Public/User/index.html?token=${token}`;
      res.redirect(frontendUrl);
    })(req, res, next);
  }
);

=======
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
export default router;
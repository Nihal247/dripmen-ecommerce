// ==============================
// ✅ IMPORTS
// ==============================
import User from "../models/userModel.js";
import OTP from "../models/otpModel.js";
import generateToken from "../utils/generateToken.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

// ==============================
// ✅ SEND SIGNUP OTP
// ==============================
export const sendSignupOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ status: "error", message: "Email is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ status: "error", message: "Invalid email format" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ status: "error", message: "Email already registered" });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    await OTP.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), 
    });

    console.log("Signup OTP:", otp);

    res.status(200).json({ status: "success", message: "OTP sent successfully" });

  } catch (error) {
    console.error("SEND OTP ERROR:", error);
    res.status(500).json({ status: "error", message: "Failed to send OTP" });
  }
};

// ==============================
// ✅ VERIFY OTP + CREATE USER
// ==============================
export const verifySignupOtp = async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

    if (!name || !email || !password || !otp) {
      return res.status(400).json({ status: "error", message: "All fields are required" });
    }

    const otpDoc = await OTP.findOne({ email, otp });

    if (!otpDoc || otpDoc.expiresAt < new Date()) {
      return res.status(400).json({ status: "error", message: "Invalid or expired OTP" });
    }

    const user = await User.create({ name, email, password });
    await OTP.deleteMany({ email });

    res.status(200).json({
      status: "success",
token: generateToken(user._id, user.is_Admin || false),
      message: "Account created successfully",
    });

  } catch (error) {
    res.status(500).json({ status: "error", message: "Signup failed" });
  }
};

// ==============================
// ✅ USER LOGIN
// ==============================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

const token = jwt.sign(
  { id: user._id, is_Admin: user.is_Admin || false },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);

    res.status(200).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================
// ✅ GET CURRENT USER
// ==============================
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================
// ✅ FORGOT PASSWORD (STABLE VERSION)
// ==============================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    // 1. Generate a simple token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // 2. Save the HASHED version to the database
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    // 3. Send the RAW token to the user
    const resetUrl = `http://localhost:5500/reset-password.html?token=${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      to: user.email,
      subject: "Password Reset - DripMen",
      html: `<h3>DripMen Password Reset</h3>
             <p>Click the link below to reset your password. It expires in 10 minutes:</p>
             <a href="${resetUrl}">${resetUrl}</a>`
    });

    res.json({ status: "success", message: "Reset link sent to email" });

  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// ==============================
// ✅ RESET PASSWORD (STABLE VERSION)
// ==============================
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // 1. Hash the incoming token from Postman to compare it with the DB
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // 2. Find user where hashed token matches and isn't expired
    const user = await User.findOne({
  resetPasswordToken: hashedToken,
  resetPasswordExpire: { $gt: Date.now() }
});

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "Token is invalid or has expired."
      });
    }

  user.password = password;
    
    // 4. Important: Clear the reset fields
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    res.status(200).json({ status: "success", message: "Password reset successful" });

  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
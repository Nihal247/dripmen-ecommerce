// ==============================
// ✅ IMPORTS
// ==============================
import User from "../models/userModel.js";
import OTP from "../models/otpModel.js";
import Wallet from "../models/walletModel.js";
import generateToken from "../utils/generateToken.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

// ==============================
// ✅ REUSABLE EMAIL TRANSPORTER
// ==============================
function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

// ==============================
// ✅ REGEX VALIDATORS
// ==============================
const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
const nameRegex = /^[A-Za-z]{2,50}(?:\s[A-Za-z]{1,50})*$/;

// ==============================
// ✅ SEND SIGNUP OTP
// ==============================
export const sendSignupOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ status: "error", message: "Email is required" });
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ status: "error", message: "Only @gmail.com addresses are allowed" });
    }

    const userExists = await User.findOne({ email: trimmedEmail });
    if (userExists) {
      return res.status(400).json({ status: "error", message: "Email already registered" });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    await OTP.create({
      email: trimmedEmail,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    console.log("Signup OTP:", otp); // keep for debugging

    // ✅ Send OTP email
    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: `"DripMen" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your DripMen Verification Code",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:12px;">
            <h2 style="color:#111;margin-bottom:8px;">DRIPMEN</h2>
            <p style="color:#555;font-size:15px;margin-bottom:24px;">Thanks for signing up! Use the code below to verify your email address.</p>
            <div style="background:#111;color:#fff;font-size:40px;font-weight:700;letter-spacing:14px;text-align:center;padding:24px;border-radius:8px;">
              ${otp}
            </div>
            <p style="color:#888;font-size:13px;margin-top:24px;">This code expires in <strong>5 minutes</strong>. Do not share it with anyone.</p>
            <p style="color:#bbb;font-size:12px;margin-top:8px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `
      });
      console.log("OTP email sent to:", email);
    } catch (emailErr) {
      console.error("OTP email send failed:", emailErr.message);
      // OTP is saved in DB — user can still verify even if email fails
    }

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

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!nameRegex.test(trimmedName)) {
      return res.status(400).json({ status: "error", message: "Name must contain only letters and single spaces (2-50 chars)" });
    }

    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ status: "error", message: "Only @gmail.com addresses are allowed" });
    }

    if (!passwordRegex.test(password)) {
      return res.status(400).json({ status: "error", message: "Password must be at least 6 characters and include an uppercase letter, lowercase letter, number, and special character" });
    }

    const otpDoc = await OTP.findOne({ email: trimmedEmail, otp });

    if (!otpDoc || otpDoc.expiresAt < new Date()) {
      return res.status(400).json({ status: "error", message: "Invalid or expired OTP" });
    }

    const user = await User.create({ name: trimmedName, email: trimmedEmail, password });
    await Wallet.create({ userId: user._id, balance: 0, transactions: [] });
    await OTP.deleteMany({ email: trimmedEmail });

    res.status(201).json({
      status: "success",
      token: generateToken(user._id, user.is_Admin || false),
      message: "Account created successfully",
    });

  } catch (error) {
    console.error("SIGNUP ERROR:", error);
    res.status(500).json({ status: "error", message: "Signup failed. Please try again." });
  }
};

// ==============================
// ✅ USER LOGIN
// ==============================
export const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    email = email.trim().toLowerCase();

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
// ✅ FORGOT PASSWORD
// ==============================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken  = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    const resetUrl = `http://localhost:5500/Public/User/reset-password.html?token=${resetToken}`;

    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"DripMen" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset - DripMen",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:12px;">
          <h2 style="color:#111;margin-bottom:8px;">DRIPMEN</h2>
          <p style="color:#555;font-size:15px;margin-bottom:24px;">We received a request to reset your password.</p>
          <a href="${resetUrl}"
             style="display:block;background:#111;color:#fff;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
            Reset My Password
          </a>
          <p style="color:#888;font-size:13px;margin-top:24px;">This link expires in <strong>10 minutes</strong>.</p>
          <p style="color:#bbb;font-size:12px;margin-top:8px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `
    });

    res.json({ status: "success", message: "Reset link sent to email" });

  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// ==============================
// ✅ RESET PASSWORD
// ==============================
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken:  hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "Token is invalid or has expired."
      });
    }

    user.password            = password;
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ status: "success", message: "Password reset successful" });

  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};


// ==============================
// ✅ UPDATE PASSWORD
// ==============================

// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    
    let updates = {};

    if (name) {
      const trimmedName = name.trim();
      if (!nameRegex.test(trimmedName)) {
        return res.status(400).json({ success: false, message: "Name must contain only letters and single spaces (2-50 chars)" });
      }
      updates.name = trimmedName;
    }
    
    if (email) {
      const trimmedEmail = email.trim().toLowerCase();
      if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({ success: false, message: "Only @gmail.com addresses are allowed" });
      }
      updates.email = trimmedEmail;
    }
    
    if (phone) {
      if (!/^\+?[\d\s-]{10,15}$/.test(phone)) {
        return res.status(400).json({ success: false, message: "Invalid phone number format" });
      }
      updates.phone = phone;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    res.json({ success: true, user });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// CHANGE PASSWORD
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select("+password");

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect"
      });
    }
    
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        success: false, 
        message: "New password must be at least 6 characters and include an uppercase letter, lowercase letter, number, and special character" 
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
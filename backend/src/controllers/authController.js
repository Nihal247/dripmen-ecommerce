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

    // Required check
    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Email is required",
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid email format",
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        status: "error",
        message: "Email already registered",
      });
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    await OTP.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiry
    });

    console.log("Signup OTP:", otp);

    res.status(200).json({
      status: "success",
      message: "OTP sent successfully",
    });

  } catch (error) {
    console.error("SEND OTP ERROR:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to send OTP",
    });
  }
};

// ==============================
// ✅ VERIFY OTP + CREATE USER
// ==============================
export const verifySignupOtp = async (req, res) => {
  try {
    console.log("VERIFY BODY:", req.body);

    const { name, email, password, otp } = req.body;

    // Required validation
    if (!name || !email || !password || !otp) {
      return res.status(400).json({
        status: "error",
        message: "All fields are required",
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid email format",
      });
    }

    // Strong password validation
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/;

    if (!strongPasswordRegex.test(password)) {
      return res.status(400).json({
        status: "error",
        message:
          "Password must be at least 6 characters and include uppercase, lowercase, and number",
      });
    }

    // Check OTP
    const otpDoc = await OTP.findOne({ email, otp });

    if (!otpDoc) {
      return res.status(400).json({
        status: "error",
        message: "Invalid OTP",
      });
    }

    if (otpDoc.expiresAt < new Date()) {
      return res.status(400).json({
        status: "error",
        message: "OTP expired",
      });
    }

    // Double-check user does not already exist
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "Email already registered",
      });
    }

    // Create user (password auto-hashed in model)
    const user = await User.create({
      name,
      email,
      password,
    });

    // Delete used OTP
    await OTP.deleteMany({ email });

    res.status(200).json({
      status: "success",
      token: generateToken(user._id),
      message: "Account created successfully",
    });

  } catch (error) {
    console.error("VERIFY ERROR:", error);
    res.status(500).json({
      status: "error",
      message: "Signup failed",
    });
  }
};

// ==============================
// ✅ USER LOGIN
// ==============================
export const loginUser = async (req, res) => {
  console.log("LOGIN BODY:", req.body);

  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required"
      });
    }

const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// ==============================
// ✅ getCurrentUser
// ==============================
export const getCurrentUser = async (req, res) => {

  try {

    const user = await User.findById(req.user.id).select("-password");

    res.json({
      success: true,
      user
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

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
      return res.status(404).json({
        status: "error",
        message: "User not found"
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    const resetUrl =
      `http://localhost:5500/reset-password.html?token=${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      to: user.email,
      subject: "Password Reset",
      html: `<p>Reset your password:</p>
             <a href="${resetUrl}">${resetUrl}</a>`
    });

    res.json({
      status: "success",
      message: "Reset link sent to email"
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};

// ==============================
// ✅ RESET PASSWORD
// ==============================
export const resetPassword = async (req, res) => {

  try {

    const { token, password } = req.body;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "Token invalid or expired"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;

    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    res.json({
      status: "success",
      message: "Password reset successful"
    });

  } catch (error) {

    res.status(500).json({
      status: "error",
      message: error.message
    });

  }
};


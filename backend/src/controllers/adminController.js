import User from "../models/userModel.js";
import Order from "../models/orderModel.js";
import Product from "../models/Product.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const adminLogin = async (req, res) => {
  try {

    const { email, password } = req.body;


    // find user
const admin = await User.findOne({ email }).select("+password");


    if (!admin) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // check admin role
    if (!admin.isAdmin) {
      return res.status(403).json({
        message: "Not an admin"
      });
    }

    // check password
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid password"
      });
    }

    // create token
    const token = jwt.sign(
  { id: admin._id, isAdmin: true },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);
    res.json({
      success: true,
      token,
      admin
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

 // ✅ GET ALL USERS
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ BLOCK / UNBLOCK USER
export const toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({
      success: true,
      message: user.isBlocked ? "User blocked" : "User unblocked",
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ DELETE USER
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isAdmin) {
      return res.status(400).json({ message: "Cannot delete admin user" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ DASHBOARD STATS
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    const orders = await Order.find({ orderStatus: { $ne: "cancelled" } });
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name email");

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: Math.round(totalRevenue)
      },
      recentOrders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
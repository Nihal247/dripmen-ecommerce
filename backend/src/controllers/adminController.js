import User from "../models/userModel.js";
import Order from "../models/orderModel.js";
import Product from "../models/Product.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Wallet from "../models/walletModel.js";

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

    // 💰 REVENUE CALCULATIONS
    const orders = await Order.find({ orderStatus: { $ne: "cancelled" } });
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

    // 🕒 PENDING & LOW STOCK
    const pendingOrders = await Order.countDocuments({ orderStatus: "processing" });
    const lowStockItems = await Product.countDocuments({ stock: { $lt: 5 } });

    // 📈 RECENT ORDERS (Last 8)
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("user", "name email");

    // 🔥 BEST SELLERS (Top 5)
    const bestSellers = await Product.find()
      .sort({ sales: -1 })
      .limit(5);

    // 📉 REVENUE DATA FOR CHARTS (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const revenueByDay = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          orderStatus: { $ne: "cancelled" }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$total" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: Math.round(totalRevenue),
        pendingOrders,
        lowStockItems
      },
      recentOrders,
      bestSellers,
      revenueByDay
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// ✅ SALES REPORT (Professional Aggregation)
export const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, reportType } = req.query;
    let start, end;

    // 1. Determine Date Range
    if (startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      const today = new Date();
      start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
      end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
      
      if (reportType === "Weekly") {
        start.setDate(today.getDate() - 7);
      } else if (reportType === "Monthly") {
        start.setMonth(today.getMonth() - 1);
      } else if (reportType === "Yearly") {
        start.setFullYear(today.getFullYear() - 1);
      }
    }

    // 2. Fetch Orders within range (excluding cancelled)
    const matchQuery = {
      createdAt: { $gte: start, $lte: end },
      orderStatus: { $nin: ["cancelled"] }
    };

    // 3. Aggregate Data
    let groupingFormat = "%Y-%m-%d";
    if (reportType === "Monthly") groupingFormat = "%Y-%m";
    if (reportType === "Yearly")  groupingFormat = "%Y";

    const reportData = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: groupingFormat, date: "$createdAt" } },
          ordersCount: { $sum: 1 },
          grossSales:  { $sum: { $add: ["$subtotal", "$deliveryCharge"] } },
          discounts:   { $sum: "$discount" },
          netSales:     { $sum: "$total" }
        }
      },
      { $sort: { "_id": -1 } }
    ]);

    // 4. Totals Calculation
    const summary = reportData.reduce((acc, curr) => {
      acc.totalOrders   += curr.ordersCount;
      acc.totalGross    += curr.grossSales;
      acc.totalDiscount += curr.discounts;
      acc.totalNet      += curr.netSales;
      return acc;
    }, { totalOrders: 0, totalGross: 0, totalDiscount: 0, totalNet: 0 });

    res.status(200).json({
      success: true,
      reportData,
      summary,
      dateRange: { start, end }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ GET ADMIN NOTIFICATIONS (Badges)
export const getNotifications = async (req, res) => {
  try {
    const newOrders = await Order.countDocuments({ orderStatus: "processing" });
    const returnRequests = await Order.countDocuments({ returnStatus: "requested" });
    const lowStock = await Product.countDocuments({ stock: { $lt: 5 } });

    res.status(200).json({
      success: true,
      notifications: {
        newOrders,
        returnRequests,
        lowStock
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// ✅ GET ALL TRANSACTIONS (Wallet aggregation)
export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Wallet.aggregate([
      { $unwind: "$transactions" },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: "$userDetails" },
      {
        $project: {
          _id: 0,
          transactionId: "$transactions._id",
          amount: "$transactions.amount",
          type: "$transactions.type",
          description: "$transactions.description",
          date: "$transactions.date",
          userName: "$userDetails.name",
          userEmail: "$userDetails.email"
        }
      },
      { $sort: { date: -1 } }
    ]);

    res.status(200).json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

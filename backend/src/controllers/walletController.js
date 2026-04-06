import Wallet from "../models/walletModel.js";
import Razorpay from "razorpay";
import crypto   from "crypto";

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ✅ GET WALLET DETAILS
export const getWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user.id });
    
    // Auto-create wallet if not exists
    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user.id, balance: 0, transactions: [] });
    }

    res.status(200).json({ success: true, wallet });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ CREATE STANDALONE WALLET
export const createWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user.id });
    if (wallet) {
      return res.status(400).json({ success: false, message: "Wallet already exists" });
    }
    wallet = await Wallet.create({ userId: req.user.id, balance: 0, transactions: [] });
    res.status(201).json({ success: true, wallet });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ ADD-MONEY (Initiate Razorpay)
export const addMoney = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 1) {
      return res.status(400).json({ success: false, message: "Minimum amount is ₹1" });
    }

    const options = {
      amount:   Math.round(amount * 100), // convert to paise
      currency: "INR",
      receipt:  `wallet_add_${Date.now()}`,
      notes: {
        userId: req.user.id.toString()
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: razorpayOrder.id,
      amount:  razorpayOrder.amount,
      keyId:   process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ VERIFY-PAYMENT (Verify & Update Balance)
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    const body      = razorpay_order_id + "|" + razorpay_payment_id;
    const expected  = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    let wallet = await Wallet.findOne({ userId: req.user.id });
    if (!wallet) {
      wallet = new Wallet({ userId: req.user.id, balance: 0 });
    }

    wallet.balance += parseFloat(amount);
    wallet.transactions.push({
      amount:      parseFloat(amount),
      type:        "credit",
      description: "Wallet Add Money (Razorpay)",
      createdAt:   new Date()
    });

    await wallet.save();

    res.status(200).json({ success: true, message: "Wallet updated", wallet });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ HELPERS FOR ORDER PROCESSING
export const deductMoneyFromWallet = async (userId, amount, description, orderId = null) => {
    const wallet = await Wallet.findOne({ userId: userId });
    if (!wallet || wallet.balance < amount) {
        throw new Error("Insufficient wallet balance");
    }
    wallet.balance -= parseFloat(amount);
    wallet.transactions.push({
        amount:      parseFloat(amount),
        type:        "debit",
        description: description,
        orderId:     orderId,
        createdAt:   new Date()
    });
    await wallet.save();
};

export const addMoneyToWallet = async (userId, amount, description, orderId = null) => {
    let wallet = await Wallet.findOne({ userId: userId });
    if (!wallet) {
        wallet = new Wallet({ userId: userId, balance: 0 });
    }
    wallet.balance += parseFloat(amount);
    wallet.transactions.push({
        amount:      parseFloat(amount),
        type:        "credit",
        description: description,
        orderId:     orderId,
        createdAt:   new Date()
    });
    await wallet.save();
};

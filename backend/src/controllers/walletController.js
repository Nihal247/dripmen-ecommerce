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
    let wallet = await Wallet.findOne({ user: req.user.id });
    
    // Auto-create wallet if not exists
    if (!wallet) {
      wallet = await Wallet.create({ user: req.user.id, balance: 0, transactions: [] });
    }

    res.status(200).json({ success: true, wallet });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ CREATE TOP-UP ORDER (Razorpay)
export const createTopupOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 1) {
      return res.status(400).json({ success: false, message: "Minimum amount is $1" });
    }

    const options = {
      amount:   Math.round(amount * 100), // convert to paise
      currency: "INR",
      receipt:  `topup_${Date.now()}`,
      notes: {
        userId: req.user.id.toString(),
        type:   "wallet_topup"
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      order:   razorpayOrder,
      keyId:   process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ VERIFY TOP-UP PAYMENT
export const verifyTopup = async (req, res) => {
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

    // UPDATE WALLET
    let wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      wallet = new Wallet({ user: req.user.id, balance: 0 });
    }

    wallet.balance += parseFloat(amount);
    wallet.transactions.push({
      amount:      parseFloat(amount),
      type:        "credit",
      description: "Wallet Top-up (Razorpay)",
      date:        new Date()
    });

    await wallet.save();

    res.status(200).json({ success: true, message: "Wallet topped up successfully", wallet });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ HELPERS FOR INTERNAL USE
export const addMoneyToWallet = async (userId, amount, description, orderId = null) => {
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
        wallet = new Wallet({ user: userId, balance: 0 });
    }
    wallet.balance += parseFloat(amount);
    wallet.transactions.push({
        amount:      parseFloat(amount),
        type:        "credit",
        description: description,
        orderId:     orderId,
        date:        new Date()
    });
    await wallet.save();
};

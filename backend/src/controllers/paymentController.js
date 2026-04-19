import Razorpay from "razorpay";
import crypto  from "crypto";
import Order   from "../models/orderModel.js";

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});
console.log(process.env.RAZORPAY_KEY_ID);
// ✅ CREATE RAZORPAY ORDER
export const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    // get order from DB
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // create razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount:   Math.round(order.total * 100), // in paise
      currency: "INR",
      receipt:  `receipt_${orderId}`,
      notes: {
        orderId: orderId.toString(),
        userId:  req.user.id.toString()
      }
    });

    res.status(200).json({
      success:        true,
      razorpayOrderId: razorpayOrder.id,
      amount:          razorpayOrder.amount,
      currency:        razorpayOrder.currency,
      keyId:           process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    const msg = error.error?.description || error.message || "Payment Gateway Error";
    res.status(500).json({ success: false, message: msg });
  }
};

// ✅ VERIFY PAYMENT
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body;

    // verify signature
    const body      = razorpay_order_id + "|" + razorpay_payment_id;
    const expected  = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed"
      });
    }

    // update order in DB
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        paymentStatus:   "paid",
        paymentId:       razorpay_payment_id,
        razorpayOrderId: razorpay_order_id
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
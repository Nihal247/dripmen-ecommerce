import Order from "../models/orderModel.js";
import Cart  from "../models/cartModel.js";
import Product from "../models/Product.js";
import { addMoneyToWallet } from "./walletController.js";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ✅ PLACE ORDER
export const placeOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { address, paymentMethod, couponCode, notes, items: customItems } = req.body;
    if (!paymentMethod) {
  return res.status(400).json({
    message: "Payment method is required",
  });
}

    if (!address) {
      return res.status(400).json({ message: "Address is required" });
    }

    // 🛒 FETCH ITEMS (Priority: Custom Items > Cart)
    let finalItems = [];

    if (customItems && customItems.length > 0) {
      // Direct checkout (e.g. Buy Now)
      finalItems = customItems;
    } else {
      // Checkout from cart
      const cart = await Cart.findOne({ user: userId }).populate("items.product");
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }
      finalItems = cart.items;
    }

    const productIds = finalItems.map(item => item.product?._id || item.product);

    const products = await Product.find({
      _id: { $in: productIds }
    });

    const productMap = {};
    products.forEach(p => {
      productMap[p._id.toString()] = p;
    });

    const orderItems = [];

    for (const item of finalItems) {
      const pId = item.product?._id ? item.product._id.toString() : item.product.toString();
      const product = productMap[pId];

  if (item.quantity <= 0) {
  return res.status(400).json({
    message: "Invalid quantity",
  });
}

    // ❌ SIZE-SPECIFIC STOCK VALIDATION (With Fallback)
    const sizeObj = product.sizes.find(s => s.size === (item.size || "L"));
    const availableStock = sizeObj ? sizeObj.stock : product.stock || 0;
    
    if (availableStock < item.quantity) {
      return res.status(400).json({
        message: `${product.name}${item.size ? ` (Size: ${item.size})` : ""} is out of stock`,
      });
    }

    // ✅ ADD ITEM TO ORDER
    orderItems.push({
      product:  product._id,
      name:     product.name,
      image:    product.images?.[0] || "",
      price:    product.price, 
      quantity: item.quantity,
      size:     item.size  || "L",
      color:    item.color || "Black"
    });

    // ✅ REDUCE STOCK (Size-Specific and Global Summary)
    if (sizeObj) sizeObj.stock -= item.quantity;
    product.stock -= item.quantity;
    
    await product.save();
  }

    // calculate totals
    const subtotal       = orderItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const deliveryCharge = subtotal >= 200 ? 0 : 20;
    const discount       = couponCode === "DRIP20" ? Math.round(subtotal * 0.2) : 0;
    const total          = subtotal + deliveryCharge - discount;

    // create order
    const order = await Order.create({
      user:     userId,
      items:    orderItems,
      address,
      paymentMethod:  paymentMethod || "COD",
      paymentStatus:  "pending",
      orderStatus:    "processing",
      subtotal,
      deliveryCharge,
      discount,
      couponCode: couponCode || "",
      total,
      notes: notes || ""
    });

    // 🧹 CLEANUP: Clear cart ONLY if checking out from cart
    if (!customItems || customItems.length === 0) {
        const cart = await Cart.findOne({ user: userId });
        if (cart) {
            cart.items = [];
            await cart.save();
        }
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ GET ALL ORDERS (for logged in user)
export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 }); // newest first

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ GET SINGLE ORDER
export const getOrderById = async (req, res) => {
  try {
    const userId  = req.user.id;
    const { id }  = req.params;

    const order = await Order.findOne({ _id: id, user: userId });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      success: true,
      order
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ CANCEL ORDER
export const cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, user: userId });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (["shipped", "delivered"].includes(order.orderStatus)) {
      return res.status(400).json({
        message: "Cannot cancel order that is already shipped or delivered"
      });
    }

    order.orderStatus = "cancelled";
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ ADMIN — GET ALL ORDERS
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ ADMIN — UPDATE ORDER STATUS
export const updateOrderStatus = async (req, res) => {
  try {
    const { id }          = req.params;
    const { orderStatus, paymentStatus } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (orderStatus)   order.orderStatus   = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order updated",
      order
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ REQUEST RETURN (User)
export const requestReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, refundMethod } = req.body;

    const order = await Order.findOne({ _id: id, user: req.user.id });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.orderStatus.toLowerCase() !== "delivered") {
      return res.status(400).json({ success: false, message: "Only delivered orders can be returned" });
    }

    order.returnStatus = "requested";
    order.returnReason = reason || "No reason provided";
    order.refundMethod = refundMethod || "wallet";

    await order.save();

    res.status(200).json({ success: true, message: "Return requested successfully", order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ APPROVE RETURN (Admin)
export const approveReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.returnStatus !== "requested") {
      return res.status(400).json({ success: false, message: "No return request found for this order" });
    }

    // 1. REFUND LOGIC
    if (order.refundMethod === "wallet") {
        // Instant Wallet Refund
        await addMoneyToWallet(
            order.user, 
            order.total, 
            `Refund for Order #${order._id.toString().slice(-6).toUpperCase()}`,
            order._id
        );
    } else if (order.refundMethod === "original") {
        // Original Payment Refund (Razorpay)
        if (order.paymentMethod === "Razorpay" && order.paymentId) {
            await razorpay.payments.refund(order.paymentId, {
                amount: Math.round(order.total * 100),
                notes: { orderId: order._id.toString() }
            });
        }
    }

    // 2. UPDATE ORDER STATUS
    order.returnStatus = "approved";
    order.orderStatus  = "returned";
    order.paymentStatus = "refunded";
    
    await order.save();

    // 3. RESTORE STOCK
    for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
            const sizeObj = product.sizes.find(s => s.size === item.size);
            if (sizeObj) sizeObj.stock += item.quantity;
            product.stock += item.quantity;
            await product.save();
        }
    }

    res.status(200).json({ success: true, message: "Return approved and refund processed", order });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ REJECT RETURN (Admin)
export const rejectReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.returnStatus = "rejected";
    if (adminNotes) order.notes = `Return Rejected: ${adminNotes}`;

    await order.save();

    res.status(200).json({ success: true, message: "Return request rejected", order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
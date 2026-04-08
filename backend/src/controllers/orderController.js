import Order from "../models/orderModel.js";
import Cart  from "../models/cartModel.js";
import Product from "../models/Product.js";
import Coupon from "../models/couponModel.js";
import { addMoneyToWallet, deductMoneyFromWallet } from "./walletController.js";
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

    orderItems.push({
      product:  product._id,
      name:     product.name,
      image:    product.images?.[0] || "",
      price:    product.price, 
      quantity: item.quantity,
      size:     item.size  || "L",
      color:    item.color || "Black",
      status:   "processing"
    });

    // ✅ REDUCE STOCK (Size-Specific and Global Summary)
    if (sizeObj) sizeObj.stock -= item.quantity;
    product.stock -= item.quantity;
    
    await product.save();
  }

    // calculate totals
    const subtotal       = orderItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const deliveryCharge = subtotal >= 200 ? 0 : 20;
    
    let discount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        expiryDate: { $gt: new Date() }
      });

      if (coupon && subtotal >= coupon.minPurchase) {
        if (coupon.discountType === "percentage") {
          discount = Math.round((subtotal * coupon.discountValue) / 100);
        } else {
          discount = coupon.discountValue;
        }
        appliedCoupon = coupon.code;
      }
    }

    const total = subtotal + deliveryCharge - discount;

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

    // 💰 WALLET LOGIC
    if (paymentMethod.toLowerCase() === "wallet") {
      try {
        await deductMoneyFromWallet(
          userId,
          total,
          `Order Payment #${order._id.toString().slice(-6).toUpperCase()}`,
          order._id
        );
        order.paymentStatus = "confirmed";
        await order.save();
      } catch (err) {
        // Rollback stock if wallet payment fails
        for (const item of orderItems) {
          const product = await Product.findById(item.product);
          if (product) {
            const sizeObj = product.sizes.find(s => s.size === item.size);
            if (sizeObj) sizeObj.stock += item.quantity;
            product.stock += item.quantity;
            await product.save();
          }
        }
        await Order.findByIdAndDelete(order._id);
        return res.status(400).json({ success: false, message: err.message });
      }
    }

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

// ✅ CANCEL ORDER ITEM (User)
export const cancelOrderItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId, productId, size } = req.body;

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Find the specific item
    const item = order.items.find(i => 
      i.product.toString() === productId && i.size === size && i.status !== "cancelled"
    );

    if (!item) return res.status(404).json({ success: false, message: "Item not found or already cancelled" });

    if (["shipped", "delivered", "cancelled", "returned"].includes(item.status)) {
      return res.status(400).json({ success: false, message: "Cannot cancel item in its current state" });
    }

    // 1. Calculate Refund Amount
    let refundAmount = item.price * item.quantity;
    
    // 2. Handle Coupon Recalculation
    if (order.couponCode) {
      const coupon = await Coupon.findOne({ code: order.couponCode.toUpperCase() });
      if (coupon) {
        const currentSubtotal = order.items.reduce((sum, i) => 
          sum + (i.status !== "cancelled" && i.status !== "returned" ? i.price * i.quantity : 0), 0
        );
        const newSubtotal = currentSubtotal - (item.price * item.quantity);

        if (newSubtotal < coupon.minPurchase) {
          // If subtotal falls below min, the entire discount is revoked from this refund
          // Basically: user should have paid (newSubtotal + delivery) without coupon.
          // They already paid (originalTotal).
          // Refund = originalTotal - (newSubtotal + newDelivery)
          const newDelivery = newSubtotal >= 200 ? 0 : 20;
          const originalPaid = order.total;
          const shouldHavePaid = newSubtotal + newDelivery;
          refundAmount = originalPaid - shouldHavePaid;
          
          // Ensure refund isn't negative (edge case if delivery charge jumps)
          refundAmount = Math.max(0, refundAmount);
          
          order.discount = 0;
          order.couponCode = "";
          order.notes = (order.notes || "") + ` | Coupon removed: subtotal fell below ${coupon.minPurchase}`;
        } else {
          // Proportionate discount reduction
          if (coupon.discountType === "percentage") {
            const itemDiscount = Math.round((item.price * item.quantity * coupon.discountValue) / 100);
            refundAmount -= itemDiscount;
          } else {
            // For fixed discount, we keep the coupon as long as minPurchase is met
            // No reduction unless we want to be very strict
          }
        }
      }
    }

    // 3. Process Refund (if paid)
    if (order.paymentStatus === "confirmed" || order.paymentStatus === "paid") {
      await addMoneyToWallet(
        userId,
        refundAmount,
        `Refund for cancelled item (${item.name}) from Order #${order._id.toString().slice(-6).toUpperCase()}`,
        order._id
      );
    }

    // 4. Restore Stock
    const product = await Product.findById(productId);
    if (product) {
      const sObj = product.sizes.find(s => s.size === size);
      if (sObj) sObj.stock += item.quantity;
      product.stock += item.quantity;
      await product.save();
    }

    // 5. Update Item and Order
    item.status = "cancelled";
    item.refundAmount = refundAmount;
    
    // Recalculate order total for record keeping
    const activeItems = order.items.filter(i => i.status !== "cancelled" && i.status !== "returned");
    if (activeItems.length === 0) {
      order.orderStatus = "cancelled";
    }
    
    const newTotalSub = order.items.reduce((sum, i) => 
      sum + (i.status !== "cancelled" && i.status !== "returned" ? i.price * i.quantity : 0), 0
    );
    order.subtotal = newTotalSub;
    order.deliveryCharge = (newTotalSub >= 200 || newTotalSub === 0) ? 0 : 20;
    order.total = order.subtotal + order.deliveryCharge - order.discount;

    await order.save();

    res.status(200).json({ success: true, message: "Item cancelled and refund processed", refundAmount, order });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

// ✅ REQUEST RETURN ITEM (User)
export const requestReturnItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId, productId, size, reason } = req.body;

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const item = order.items.find(i => 
      i.product.toString() === productId && i.size === size && i.status === "delivered"
    );

    if (!item) return res.status(404).json({ success: false, message: "Item not eligible for return" });

    item.returnStatus = "requested";
    item.returnReason = reason || "No reason provided";

    await order.save();
    res.status(200).json({ success: true, message: "Return request submitted", order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ APPROVE RETURN ITEM (Admin)
export const approveReturnItem = async (req, res) => {
  try {
    const { orderId, productId, size } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const item = order.items.find(i => 
      i.product.toString() === productId && i.size === size && i.returnStatus === "requested"
    );

    if (!item) return res.status(404).json({ success: false, message: "Return request not found" });

    // 1. Calculate Refund (similar logic to cancel)
    let refundAmount = item.price * item.quantity;
    
    if (order.couponCode) {
      const coupon = await Coupon.findOne({ code: order.couponCode.toUpperCase() });
      if (coupon) {
        const currentSubtotal = order.items.reduce((sum, i) => 
          sum + (i.status !== "cancelled" && ["none", "requested", "rejected"].includes(i.returnStatus) ? i.price * i.quantity : 0), 0
        );
        const newSubtotal = currentSubtotal - (item.price * item.quantity);

        if (newSubtotal < coupon.minPurchase) {
          const newDelivery = newSubtotal >= 200 ? 0 : 20;
          refundAmount = order.total - (newSubtotal + newDelivery);
          refundAmount = Math.max(0, refundAmount);
          order.discount = 0;
          order.couponCode = "";
        } else {
          if (coupon.discountType === "percentage") {
            const itemDiscount = Math.round((item.price * item.quantity * coupon.discountValue) / 100);
            refundAmount -= itemDiscount;
          }
        }
      }
    }

    // 2. Process Refund
    await addMoneyToWallet(
      order.user,
      refundAmount,
      `Refund for returned item (${item.name}) from Order #${order._id.toString().slice(-6).toUpperCase()}`,
      order._id
    );

    // 3. Restore Stock
    const product = await Product.findById(productId);
    if (product) {
      const sObj = product.sizes.find(s => s.size === size);
      if (sObj) sObj.stock += item.quantity;
      product.stock += item.quantity;
      await product.save();
    }

    // 4. Update Status
    item.returnStatus = "approved";
    item.status = "returned";
    item.refundAmount = refundAmount;

    // Recalculate order total
    const newTotalSub = order.items.reduce((sum, i) => 
      sum + (i.status !== "cancelled" && i.status !== "returned" ? i.price * i.quantity : 0), 0
    );
    order.subtotal = newTotalSub;
    order.deliveryCharge = (newTotalSub >= 200 || newTotalSub === 0) ? 0 : 20;
    order.total = order.subtotal + order.deliveryCharge - order.discount;

    await order.save();
    res.status(200).json({ success: true, message: "Return approved and refund processed", order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ REJECT RETURN ITEM (Admin)
export const rejectReturnItem = async (req, res) => {
  try {
    const { orderId, productId, size, adminNotes } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const item = order.items.find(i => 
      i.product.toString() === productId && i.size === size && i.returnStatus === "requested"
    );

    if (!item) return res.status(404).json({ success: false, message: "Return request not found" });

    item.returnStatus = "rejected";
    if (adminNotes) item.reason = (item.reason || "") + ` | Rejected: ${adminNotes}`;

    await order.save();
    res.status(200).json({ success: true, message: "Return request rejected", order });
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
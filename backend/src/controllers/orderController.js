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

const FREE_DELIVERY_THRESHOLD = 1000;
const DELIVERY_CHARGE = 40;

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

    const nameRegex = /^[A-Za-z]{2,50}(?:\s[A-Za-z]{1,50})*$/;
    const phoneRegex = /^\+?[\d\s-]{10,15}$/;
    const zipRegex = /^[A-Za-z0-9\s-]{3,10}$/;

    if (!address.fullName || !nameRegex.test(address.fullName)) {
      return res.status(400).json({ message: "Valid name is required" });
    }
    if (!address.phone || !phoneRegex.test(address.phone)) {
      return res.status(400).json({ message: "Valid phone number is required" });
    }
    if (!address.street || address.street.trim().length < 3) {
      return res.status(400).json({ message: "Valid street is required" });
    }
    if (!address.city || address.city.trim().length < 2) {
      return res.status(400).json({ message: "Valid city is required" });
    }
    if (!address.zip || !zipRegex.test(address.zip)) {
      return res.status(400).json({ message: "Valid ZIP/Postal code is required" });
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
        return res.status(400).json({ message: "Invalid quantity" });
      }

      const sizeObj = product.sizes.find(s => s.size === (item.size || "L"));
      const availableStock = sizeObj ? sizeObj.stock : product.stock || 0;
      
      if (availableStock < item.quantity) {
        return res.status(400).json({
          message: `${product.name}${item.size ? ` (Size: ${item.size})` : ""} is out of stock`,
        });
      }

      // Professional Price Logic: PaidPrice = SalePrice || MRP
      const paidPrice = product.salePrice || product.price;

      orderItems.push({
        product:  product._id,
        name:     product.name,
        image:    product.images?.[0] || "",
        mrp:      product.price, // Original MRP
        price:    paidPrice,     // Actual paid price per item
        quantity: item.quantity,
        size:     item.size  || "L",
        color:    item.color || "Black",
        status:   "processing"
      });

      // ✅ REDUCE STOCK & INCREMENT SALES
      if (sizeObj) sizeObj.stock -= item.quantity;
      product.stock -= item.quantity;
      product.sales = (product.sales || 0) + item.quantity; // ✅ Track sales for Best Sellers
      await product.save();
    }

    // 1. Calculate MRP Total
    const totalMRP = orderItems.reduce((sum, i) => sum + (i.mrp * i.quantity), 0);
    
    // 2. Calculate Product Discount (MRP - PricePaid)
    const productDiscount = orderItems.reduce((sum, i) => sum + ((i.mrp - i.price) * i.quantity), 0);

    // 3. Get SUBTOTAL (MRP - Product Discount)
    const subtotal = totalMRP - productDiscount;

    // 4 & 5. Coupon Logic
    let discount = 0;
    let appliedCouponObj = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        expiryDate: { $gt: new Date() }
      });

      if (coupon) {
        // Enforce isOneTimePerUser
        const alreadyUsed = coupon.isOneTimePerUser && coupon.usedByUsers.includes(userId);
        
        if (!alreadyUsed && subtotal >= coupon.minPurchase) {
          if (coupon.discountType === "percentage") {
            discount = (subtotal * coupon.discountValue) / 100;
            if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
              discount = coupon.maxDiscountAmount;
            }
          } else {
            discount = coupon.discountValue;
          }
          
          discount = Math.round(discount);
          discount = Math.min(discount, subtotal);
          appliedCouponObj = coupon;
        }
      }
    }

    // 6. Delivery Fee
    const deliveryCharge = subtotal >= 1000 ? 0 : 40; // Standardize threshold

    // 7. Final Total
    const total = subtotal + deliveryCharge - discount;

    // create order
    const order = await Order.create({
      user:           userId,
      items:          orderItems,
      address,
      paymentMethod:  paymentMethod || "COD",
      paymentStatus:  "pending",
      orderStatus:    "processing",
      totalMRP,
      productDiscount,
      subtotal,
      deliveryCharge,
      discount,
      couponCode:     appliedCouponObj ? appliedCouponObj.code : "",
      total,
      notes:          notes || ""
    });

    // Record Coupon Usage
    if (appliedCouponObj) {
        appliedCouponObj.usedByUsers.push(userId);
        await appliedCouponObj.save();
    }

    // 💰 WALLET LOGIC
    if (paymentMethod.toLowerCase() === "wallet") {
      try {
        await deductMoneyFromWallet(
          userId,
          total,
          `Order Payment #${order._id.toString().slice(-6).toUpperCase()}`,
          order._id
        );
        order.paymentStatus = "paid";
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
    const { orderId, productId, size, refundMethod } = req.body; // refundMethod: 'wallet' or 'original'

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Find the specific item
    const item = order.items.find(i => 
      i.product.toString() === productId && i.size === size && i.status !== "cancelled"
    );

    if (!item) return res.status(404).json({ success: false, message: "Item not found or already cancelled" });

    if (["shipped", "delivered", "cancelled", "returned"].includes(item.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel item in its current state (${item.status})` });
    }

    // --- RECALCULATION LOGIC ---
    const originalTotal = order.total;
    const itemValue = item.price * item.quantity;
    
    // Mark item as cancelled temporarily for recalculation
    item.status = "cancelled";

    // 1. New Subtotal (active items only)
    const activeItems = order.items.filter(i => i.status !== "cancelled" && i.status !== "returned");
    const newSubtotal = activeItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    
    // 2. Coupon Re-validation
    let newDiscount = 0;
    let couponRemoved = false;
    if (order.couponCode) {
      const coupon = await Coupon.findOne({ code: order.couponCode.toUpperCase() });
      if (coupon) {
        if (newSubtotal < coupon.minPurchase || !coupon.isActive) {
          newDiscount = 0;
          order.couponCode = "";
          couponRemoved = true;
          order.notes = (order.notes || "") + ` | Coupon removed: subtotal ₹${newSubtotal} < min ₹${coupon.minPurchase}`;
        } else {
          // Recalculate discount value (especially for percentage)
          if (coupon.discountType === "percentage") {
            newDiscount = Math.round((newSubtotal * coupon.discountValue) / 100);
            if (coupon.maxDiscountAmount && newDiscount > coupon.maxDiscountAmount) {
              newDiscount = coupon.maxDiscountAmount;
            }
          } else {
            newDiscount = coupon.discountValue;
          }
          newDiscount = Math.min(newDiscount, newSubtotal);
        }
      } else {
        newDiscount = 0;
        order.couponCode = "";
        couponRemoved = true;
      }
    }

    // 3. New Delivery Charge (match placeOrder logic)
    const newDeliveryCharge = (newSubtotal >= 1000 || newSubtotal === 0) ? 0 : 40;

    // 4. New Total
    const newTotal = newSubtotal + newDeliveryCharge - newDiscount;

    // 5. Final Refund Amount = What they paid - What they should have paid now
    // This correctly handles coupon shifts and delivery fee changes
    let refundAmount = originalTotal - newTotal;
    refundAmount = Math.max(0, refundAmount);

    // 6. Handle Edge Case: All items cancelled
    if (activeItems.length === 0) {
      order.orderStatus = "cancelled";
      if (order.paymentStatus === "paid") {
          order.paymentStatus = "refunded";
      }
    }

    // --- PROCESS REFUND ---
    if (order.paymentStatus === "paid" || order.paymentStatus === "refunded") {
        // ALWAYS use Wallet for refunds as requested
        await addMoneyToWallet(
            userId,
            refundAmount,
            `Refund for cancelled item (${item.name}) from Order #${order._id.toString().slice(-6).toUpperCase()}`,
            order._id
        );
        item.refundAmount = refundAmount;
        item.refundStatus = "completed";
    } else {
        // COD - No refund needed, just update values
        item.refundAmount = 0;
        item.refundStatus = "none";
    }


    // 7. Restore Stock
    const product = await Product.findById(productId);
    if (product) {
      const sObj = product.sizes.find(s => s.size === size);
      if (sObj) sObj.stock += item.quantity;
      product.stock += item.quantity;
      await product.save();
    }

    // 8. Update Order Model with new totals
    order.subtotal = newSubtotal;
    order.discount = newDiscount;
    order.deliveryCharge = newDeliveryCharge;
    order.total = newTotal;

    await order.save();

    res.status(200).json({ 
        success: true, 
        message: couponRemoved ? "Item cancelled. Coupon removed due to subtotal requirement." : "Item cancelled and refund processed.",
        refundAmount, 
        order 
    });

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

    if (orderStatus) {
      order.orderStatus = orderStatus;
      // Sync status to items that are not cancelled or returned
      order.items.forEach(item => {
        if (!["cancelled", "returned"].includes(item.status)) {
          item.status = orderStatus;
        }
      });
    }
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

// ✅ ADMIN — GET SINGLE ORDER DETAILED
export const adminGetOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate("user", "name email phone");
    
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ ADMIN — UPDATE ITEM STATUS
export const adminUpdateOrderItemStatus = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId).populate("user", "name email");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const item = order.items.id(itemId);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    if (item.status === status) {
        return res.status(200).json({ success: true, message: "Status unchanged", order });
    }

    let couponRemoved = false;

    if (status === "cancelled" && item.status !== "cancelled") {
        // --- CANCELLATION LOGIC ---
        const originalTotal = order.total;
        item.status = "cancelled";

        const activeItems = order.items.filter(i => i.status !== "cancelled" && i.status !== "returned");
        const newSubtotal = activeItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);

        let newDiscount = 0;
        if (order.couponCode) {
            const coupon = await Coupon.findOne({ code: order.couponCode.toUpperCase() });
            if (coupon) {
                if (newSubtotal < coupon.minPurchase || !coupon.isActive) {
                    newDiscount = 0;
                    order.couponCode = "";
                    couponRemoved = true;
                    order.notes = (order.notes || "") + ` | Coupon removed by admin item cancellation: subtotal < min`;
                } else {
                    if (coupon.discountType === "percentage") {
                        newDiscount = Math.round((newSubtotal * coupon.discountValue) / 100);
                        if (coupon.maxDiscountAmount && newDiscount > coupon.maxDiscountAmount) newDiscount = coupon.maxDiscountAmount;
                    } else {
                        newDiscount = coupon.discountValue;
                    }
                    newDiscount = Math.min(newDiscount, newSubtotal);
                }
            } else {
                newDiscount = 0;
                order.couponCode = "";
                couponRemoved = true;
            }
        }

        const newDeliveryCharge = (newSubtotal >= 1000 || newSubtotal === 0) ? 0 : 40;
        const newTotal = newSubtotal + newDeliveryCharge - newDiscount;

        let refundAmount = originalTotal - newTotal;
        refundAmount = Math.max(0, refundAmount);

        if (activeItems.length === 0) {
            order.orderStatus = "cancelled";
            if (order.paymentStatus === "paid") order.paymentStatus = "refunded";
        }

        if (order.paymentStatus === "paid" || order.paymentStatus === "refunded") {
            await addMoneyToWallet(order.user._id, refundAmount, `Refund for cancelled item (${item.name}) by Admin from Order #${order._id.toString().slice(-6).toUpperCase()}`, order._id);
            item.refundAmount = refundAmount;
            item.refundStatus = "completed";
        } else {
            item.refundAmount = 0;
            item.refundStatus = "none";
        }

        const product = await Product.findById(item.product);
        if (product) {
            const sObj = product.sizes.find(s => s.size === item.size);
            if (sObj) sObj.stock += item.quantity;
            product.stock += item.quantity;
            await product.save();
        }

        order.subtotal = newSubtotal;
        order.discount = newDiscount;
        order.deliveryCharge = newDeliveryCharge;
        order.total = newTotal;
        order.notes = (order.notes || "") + ` | Admin cancelled item ${item.name} at ${new Date().toLocaleString()}`;

    } else {
        // Just updating status (e.g., to shipped, delivered)
        item.status = status;
        
        // Auto-update parent orderStatus based on item statuses
        const activeItems = order.items.filter(i => i.status !== "cancelled" && i.status !== "returned");
        if (activeItems.length > 0) {
            const allDelivered = activeItems.every(i => i.status === "delivered");
            const allShipped = activeItems.every(i => i.status === "shipped" || i.status === "delivered");
            
            if (allDelivered) order.orderStatus = "delivered";
            else if (allShipped) order.orderStatus = "shipped";
            else order.orderStatus = "processing";
        }
    }

    await order.save();

    res.status(200).json({
        success: true,
        message: couponRemoved ? "Item status updated. Coupon removed due to subtotal requirements." : "Item status updated",
        order
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

    // --- RECALCULATION LOGIC ---
    const originalTotal = order.total;
    
    // Mark item as returned temporarily for recalculation
    item.status = "returned";

    // 1. New Subtotal (active items only)
    const activeItems = order.items.filter(i => i.status !== "cancelled" && i.status !== "returned");
    const newSubtotal = activeItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    
    // 2. Coupon Re-validation
    let newDiscount = 0;
    if (order.couponCode) {
      const coupon = await Coupon.findOne({ code: order.couponCode.toUpperCase() });
      if (coupon) {
        if (newSubtotal < coupon.minPurchase || !coupon.isActive) {
          newDiscount = 0;
          order.couponCode = "";
          order.notes = (order.notes || "") + ` | Coupon removed: subtotal ₹${newSubtotal} < min ₹${coupon.minPurchase}`;
        } else {
          // Recalculate discount value
          if (coupon.discountType === "percentage") {
            newDiscount = Math.round((newSubtotal * coupon.discountValue) / 100);
            if (coupon.maxDiscountAmount && newDiscount > coupon.maxDiscountAmount) {
              newDiscount = coupon.maxDiscountAmount;
            }
          } else {
            newDiscount = coupon.discountValue;
          }
          newDiscount = Math.min(newDiscount, newSubtotal);
        }
      } else {
        newDiscount = 0;
        order.couponCode = "";
      }
    }

    // 3. New Delivery Charge (match placeOrder logic)
    const newDeliveryCharge = (newSubtotal >= 1000 || newSubtotal === 0) ? 0 : 40;

    // 4. New Total
    const newTotal = newSubtotal + newDeliveryCharge - newDiscount;

    // 5. Final Refund Amount
    let refundAmount = originalTotal - newTotal;
    refundAmount = Math.max(0, refundAmount);

    // 6. Handle Edge Case: All items cancelled/returned
    if (activeItems.length === 0) {
      order.orderStatus = "returned";
    }

    // --- PROCESS REFUND ---
    if (order.paymentStatus === "paid" || order.paymentStatus === "refunded") {
        await addMoneyToWallet(
            order.user,
            refundAmount,
            `Refund for returned item (${item.name}) from Order #${order._id.toString().slice(-6).toUpperCase()}`,
            order._id
        );
        item.refundAmount = refundAmount;
    } else {
        item.refundAmount = 0;
    }

    // 7. Restore Stock
    const product = await Product.findById(productId);
    if (product) {
      const sObj = product.sizes.find(s => s.size === size);
      if (sObj) sObj.stock += item.quantity;
      product.stock += item.quantity;
      await product.save();
    }

    // 8. Update Order Model with new totals
    item.returnStatus = "approved";
    item.status = "returned";
    order.subtotal = newSubtotal;
    order.discount = newDiscount;
    order.deliveryCharge = newDeliveryCharge;
    order.total = newTotal;

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

// ✅ CANCEL FULL ORDER (User)
export const cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, user: userId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Allow cancellation only if not yet shipped/delivered
    if (!["processing", "pending", "confirmed"].includes(order.orderStatus)) {
      return res.status(400).json({ 
        success: false, 
        message: `Order cannot be cancelled in its current state (${order.orderStatus})` 
      });
    }

    // 1. Restore Stock for all active items
    for (const item of order.items) {
      if (item.status !== "cancelled" && item.status !== "returned") {
        const product = await Product.findById(item.product);
        if (product) {
          const sObj = product.sizes.find(s => s.size === item.size);
          if (sObj) sObj.stock += item.quantity;
          product.stock += item.quantity;
          await product.save();
        }
        item.status = "cancelled";
      }
    }

    // 2. Process Refund (if paid)
    // Refund the remaining total (the current value of the order)
    if (order.total > 0 && order.paymentStatus === "paid") {
      await addMoneyToWallet(
        userId,
        order.total,
        `Refund for cancelled Order #${order._id.toString().slice(-6).toUpperCase()}`,
        order._id
      );
      order.paymentStatus = "refunded";
    }

    // 3. Coupon Logic: If a one-time coupon was used, "un-use" it so they can try again
    if (order.couponCode) {
      const coupon = await Coupon.findOne({ code: order.couponCode.toUpperCase() });
      if (coupon && coupon.isOneTimePerUser) {
        coupon.usedByUsers = coupon.usedByUsers.filter(uid => uid.toString() !== userId.toString());
        await coupon.save();
      }
    }

    // 4. Update Order Status
    order.orderStatus = "cancelled";
    order.notes = (order.notes || "") + ` | Order fully cancelled by user at ${new Date().toLocaleString()}`;
    // NOTE: Financial fields (subtotal, total, etc.) are preserved for audit trail.
    // The paymentStatus='refunded' tells you what happened to the money.

    await order.save();

    res.status(200).json({ 
      success: true, 
      message: "Order cancelled successfully and refund processed to wallet." 
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
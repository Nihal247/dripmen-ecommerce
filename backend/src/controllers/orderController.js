import Order from "../models/orderModel.js";
import Cart  from "../models/cartModel.js";
import Product from "../models/Product.js";

// ✅ PLACE ORDER
export const placeOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { address, paymentMethod, couponCode, notes } = req.body;
    if (!paymentMethod) {
  return res.status(400).json({
    message: "Payment method is required",
  });
}

    if (!address) {
      return res.status(400).json({ message: "Address is required" });
    }

    // get user cart
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    const productIds = cart.items.map(item => item.product._id);

const products = await Product.find({
  _id: { $in: productIds }
});

const productMap = {};

products.forEach(p => {
  productMap[p._id.toString()] = p;
});

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

const orderItems = [];

for (const item of cart.items) {
const product = productMap[item.product._id.toString()];

  if (item.quantity <= 0) {
  return res.status(400).json({
    message: "Invalid quantity",
  });
}

    // ❌ SIZE-SPECIFIC STOCK VALIDATION
    const sizeObj = product.sizes.find(s => s.size === (item.size || "L"));
    
    if (!sizeObj || sizeObj.stock < item.quantity) {
      return res.status(400).json({
        message: `${product.name} (Size: ${item.size || "L"}) is out of stock`,
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
    sizeObj.stock -= item.quantity;
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

    // clear the cart after order placed
    cart.items = [];
    await cart.save();

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
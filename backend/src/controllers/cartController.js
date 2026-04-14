import Cart from "../models/cartModel.js";
import Product from "../models/Product.js";

<<<<<<< HEAD
const MAX_LIMIT_PER_ITEM = 10;

// ✅ ADD TO CART
export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity, size, color } = req.body;
=======
// ✅ ADD TO CART
export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware
    const { productId, quantity } = req.body;
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // check product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

<<<<<<< HEAD
    // 🚀 Stock & Limit Validation (Size-Specific with Fallback)
    const sizeObj = product.sizes.find(s => s.size === (size || "L"));
    const availableStock = sizeObj ? sizeObj.stock : product.stock || 0;

    if (availableStock <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: `${product.name}${size ? ` (Size: ${size})` : ""} is out of stock` 
      });
    }

=======
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
    let cart = await Cart.findOne({ user: userId });

    // if cart doesn't exist → create new
    if (!cart) {
      cart = new Cart({
        user: userId,
<<<<<<< HEAD
        items: [{
          product: productId,
          quantity: quantity || 1,
          size: size || "N/A",
          color: color || "Black"
        }],
      });
    } else {
      // check if product with SAME size and color already in cart
      const itemIndex = cart.items.findIndex(
        (item) =>
          item.product.toString() === productId &&
          item.size === (size || "N/A") &&
          item.color === (color || "Black")
      );

      if (itemIndex > -1) {
        // Validation for existing item
        const currentQty = cart.items[itemIndex].quantity;
        const totalNewQty = currentQty + (quantity || 1);

        if (totalNewQty > availableStock) {
          return res.status(400).json({ 
            success: false, 
            message: `Only ${availableStock} items left in stock for size ${size || "L"}` 
          });
        }
        if (totalNewQty > MAX_LIMIT_PER_ITEM) {
          return res.status(400).json({ success: false, message: `Max ${MAX_LIMIT_PER_ITEM} items allowed per product` });
        }

        cart.items[itemIndex].quantity = totalNewQty;
      } else {
        // Validation for new item
        const newQty = quantity || 1;

        if (newQty > availableStock) {
          return res.status(400).json({ 
            success: false, 
            message: `Only ${availableStock} items left in stock for size ${size || "L"}` 
          });
        }
        if (newQty > MAX_LIMIT_PER_ITEM) {
          return res.status(400).json({ success: false, message: `Max ${MAX_LIMIT_PER_ITEM} items allowed per product` });
        }

        cart.items.push({
          product: productId,
          quantity: newQty,
          size: size || "N/A",
          color: color || "Black"
        });
=======
        items: [{ product: productId, quantity: quantity || 1 }],
      });
    } else {
      // check if product already in cart
      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (itemIndex > -1) {
        // increase quantity
        cart.items[itemIndex].quantity += quantity || 1;
      } else {
        // add new item
        cart.items.push({ product: productId, quantity: quantity || 1 });
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
      }
    }

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Product added to cart",
      cart,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ GET CART
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart) {
      return res.status(200).json({ items: [] });
    }

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ UPDATE QUANTITY
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
<<<<<<< HEAD
    const { itemId } = req.params;
=======
    const { productId } = req.params;
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

<<<<<<< HEAD
    const item = cart.items.id(itemId);
=======
    const item = cart.items.find(
      (item) => item.product.toString() === productId
    );
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920

    if (!item) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

<<<<<<< HEAD
    // 🚀 Stock & Limit Validation
    // 🚀 Stock & Limit Validation (Size-Specific)
    const product = await Product.findById(item.product);
    if (product) {
      const sizeObj = product.sizes.find(s => s.size === item.size);
      const availableStock = sizeObj ? sizeObj.stock : product.stock || 0;

      if (quantity > availableStock) {
        return res.status(400).json({ 
          success: false, 
          message: `Only ${availableStock} left in stock${item.size ? ` for size ${item.size}` : ""}` 
        });
      }
    }

    if (quantity > MAX_LIMIT_PER_ITEM) {
      return res.status(400).json({ success: false, message: `Max ${MAX_LIMIT_PER_ITEM} allowed` });
    }

=======
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
    item.quantity = quantity;

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart updated",
      cart,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ REMOVE ITEM
export const removeCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
<<<<<<< HEAD
    const { itemId } = req.params;
=======
    const { productId } = req.params;
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(
<<<<<<< HEAD
      (item) => item._id.toString() !== itemId
=======
      (item) => item.product.toString() !== productId
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
    );

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Item removed",
      cart,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
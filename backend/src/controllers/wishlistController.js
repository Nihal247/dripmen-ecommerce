import Wishlist from "../models/wishlistModel.js";
import Product  from "../models/Product.js";

// ✅ GET WISHLIST
export const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    const wishlist = await Wishlist.findOne({ user: userId })
      .populate("items.product");

    if (!wishlist) {
      return res.status(200).json({ success: true, items: [] });
    }

    res.status(200).json({
      success: true,
      items: wishlist.items
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ ADD TO WISHLIST
export const addToWishlist = async (req, res) => {
  try {
    const userId    = req.user.id;
<<<<<<< HEAD
    const { productId, size } = req.body;
=======
    const { productId } = req.body;
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // check product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      // create new wishlist
      wishlist = new Wishlist({
        user:  userId,
<<<<<<< HEAD
        items: [{ product: productId, size: size || "N/A" }]
=======
        items: [{ product: productId }]
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
      });
    } else {
      // check if already in wishlist
      const exists = wishlist.items.find(
<<<<<<< HEAD
        item => item.product.toString() === productId && item.size === (size || "N/A")
=======
        item => item.product.toString() === productId
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
      );

      if (exists) {
        return res.status(200).json({
          success: true,
          message: "Already in wishlist",
          wishlist
        });
      }

<<<<<<< HEAD
      wishlist.items.push({ product: productId, size: size || "N/A" });
=======
      wishlist.items.push({ product: productId });
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
    }

    await wishlist.save();

    // populate before returning
    await wishlist.populate("items.product");

    res.status(200).json({
      success: true,
      message: "Added to wishlist",
      wishlist
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ REMOVE FROM WISHLIST
export const removeFromWishlist = async (req, res) => {
  try {
    const userId    = req.user.id;
    const { productId } = req.params;
<<<<<<< HEAD
    const { size } = req.query; // optional size filter
=======
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920

    const wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

<<<<<<< HEAD
    if (size && size !== "all") {
      wishlist.items = wishlist.items.filter(
        item => !(item.product.toString() === productId && item.size === size)
      );
    } else {
      wishlist.items = wishlist.items.filter(
        item => item.product.toString() !== productId
      );
    }
=======
    wishlist.items = wishlist.items.filter(
      item => item.product.toString() !== productId
    );
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920

    await wishlist.save();
    await wishlist.populate("items.product");

    res.status(200).json({
      success: true,
      message: "Removed from wishlist",
      wishlist
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ CLEAR WISHLIST
export const clearWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    const wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      return res.status(200).json({ success: true, message: "Wishlist already empty" });
    }

    wishlist.items = [];
    await wishlist.save();

    res.status(200).json({
      success: true,
      message: "Wishlist cleared"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
import Product from "../models/Product.js";
import Category from "../models/categoryModel.js";
import cloudinary from "../config/cloudinary.js";

// ==============================
// ✅ CREATE PRODUCT (Admin only)
// ==============================
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, salePrice, categoryId, sizes, colors, stock, section } = req.body;

    if (!name || !price || !categoryId) {
      return res.status(400).json({
        success: false,
        message: "Name, price and category are required",
      });
    }

    if (Number(price) <= 0) {
      return res.status(400).json({ success: false, message: "Price must be greater than zero" });
    }

    if (salePrice && Number(salePrice) < 0) {
      return res.status(400).json({ success: false, message: "Sale price cannot be negative" });
    }

    if (stock && Number(stock) < 0) {
      return res.status(400).json({ success: false, message: "Stock cannot be negative" });
    }

    const images = req.files ? req.files.map((f) => f.path) : [];

    // Parse section safely
    let parsedSection = [];
    if (section) {
      try { parsedSection = JSON.parse(section); } catch(e) { parsedSection = []; }
      if (!Array.isArray(parsedSection)) parsedSection = [];
    }

    const product = await Product.create({
      name,
      description,
      price: Number(price),
      salePrice: salePrice ? Number(salePrice) : null,
      categoryId,
      images,
      sizes: sizes ? JSON.parse(sizes) : [],
      colors: colors ? JSON.parse(colors) : [],
      stock: Number(stock) || 0,
      status: "active",
      section: parsedSection,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================
// ✅ GET ALL PRODUCTS (Admin)
// ==============================
export const getAdminProducts = async (req, res) => {
  try {
    const { search, category, status } = req.query;

    let filter = {};
    if (search) filter.name = { $regex: search, $options: "i" };
    if (category) filter.categoryId = category;
    if (status) filter.status = status;

    const products = await Product.find(filter)
      .populate("categoryId", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================
// ✅ GET ALL PRODUCTS (User/Public)
// ==============================
export const getProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, color, size, sort, section, search, page = 1, limit = 9 } = req.query;

    let filter = {
      status: { $in: ["active", "out_of_stock"] }
    };

    // Filter by name (search)
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    // Filter by homepage section
    if (section) {
      filter.section = { $elemMatch: { $eq: section } };
    }

    if (category && category !== "all") {
      const cat = await Category.findOne({ name: category });
      if (cat) filter.categoryId = cat._id;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (color) filter.colors = { $in: [color] };
    if (size) filter.sizes = { $in: [size] };

    let sortOption = {};
    if (sort === "price-low") sortOption = { price: 1 };
    else if (sort === "price-high") sortOption = { price: -1 };
    else if (sort === "newest") sortOption = { createdAt: -1 };
    else if (sort === "top-selling") sortOption = { sales: -1 };
    else sortOption = { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .populate("categoryId", "name")
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================
// ✅ GET PRICE RANGE (Public)
// ==============================
export const getPriceRange = async (req, res) => {
  try {
    const result = await Product.aggregate([
      { $match: { status: { $in: ["active", "out_of_stock"] } } },
      {
        $group: {
          _id: null,
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
    ]);

    if (result.length === 0) {
      return res.status(200).json({ success: true, min: 0, max: 1000 });
    }

    res.status(200).json({
      success: true,
      min: Math.floor(result[0].minPrice),
      max: Math.ceil(result[0].maxPrice),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================
// ✅ GET SINGLE PRODUCT (Public)
// ==============================
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("categoryId", "name");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================
// ✅ UPDATE PRODUCT (Admin only)
// ==============================
export const updateProduct = async (req, res) => {
  try {
    const { name, description, price, salePrice, categoryId, sizes, colors, stock, section } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (price && Number(price) <= 0) {
      return res.status(400).json({ success: false, message: "Price must be greater than zero" });
    }

    if (salePrice !== undefined && salePrice !== null && Number(salePrice) < 0) {
      return res.status(400).json({ success: false, message: "Sale price cannot be negative" });
    }

    if (stock !== undefined && Number(stock) < 0) {
      return res.status(400).json({ success: false, message: "Stock cannot be negative" });
    }

    if (req.files && req.files.length > 0) {
      for (const imageUrl of product.images) {
        const publicId = imageUrl.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`dripmen-products/${publicId}`);
      }
      product.images = req.files.map((f) => f.path);
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price ? Number(price) : product.price;
    product.salePrice = salePrice ? Number(salePrice) : product.salePrice;
    product.categoryId = categoryId || product.categoryId;
    product.sizes = sizes ? JSON.parse(sizes) : product.sizes;
    product.colors = colors ? JSON.parse(colors) : product.colors;
    product.stock = stock !== undefined ? Number(stock) : product.stock;

    // ALWAYS update section — parse safely and force Mongoose to save
    let parsedSection = [];
    if (section !== undefined && section !== null) {
      try {
        parsedSection = JSON.parse(section);
        if (!Array.isArray(parsedSection)) parsedSection = [];
      } catch(e) {
        parsedSection = [];
      }
    }
    product.section = parsedSection;
    product.markModified("section");

    await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================
// ✅ TOGGLE PRODUCT STATUS (Admin)
// ==============================
export const toggleProductStatus = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.status = product.status === "active" ? "inactive" : "active";
    await product.save();

    res.status(200).json({
      success: true,
      message: `Product ${product.status === "active" ? "enabled" : "disabled"} successfully`,
      status: product.status,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================
// ✅ DELETE PRODUCT (Admin only)
// ==============================
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    for (const imageUrl of product.images) {
      const publicId = imageUrl.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`dripmen-products/${publicId}`);
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================
// ✅ UPDATE PRODUCT STATUS (Admin)
// ==============================
export const updateProductStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json({
      success: true,
      product
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
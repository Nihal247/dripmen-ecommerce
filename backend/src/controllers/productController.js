import Product from "../models/Product.js";
import Category from "../models/categoryModel.js";
import cloudinary from "../config/cloudinary.js";

// ==============================
// ✅ CREATE PRODUCT (Admin only)
// ==============================
// Why: admin clicks "Add Product" in admin-products.html
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, salePrice, categoryId, sizes, colors, stock } = req.body;

    // Why validate: catch missing required fields before hitting DB
    if (!name || !price || !categoryId) {
      return res.status(400).json({
        success: false,
        message: "Name, price and category are required",
      });
    }

    // Why req.files: admin uploads MULTIPLE images per product
    // multer puts them in req.files array
    const images = req.files ? req.files.map((f) => f.path) : [];

    // Why JSON.parse: sizes and colors come as strings from FormData
    // e.g. '["S","M","L"]' needs to be parsed to actual array
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
// Why: admin-products.html table needs ALL products
// including inactive ones
export const getAdminProducts = async (req, res) => {
  try {
    const { search, category, status } = req.query;

    // Why build filter object: admin can search and filter
    // from the toolbar in admin-products.html
    let filter = {};
    if (search) filter.name = { $regex: search, $options: "i" };
    if (category) filter.categoryId = category;
    if (status) filter.status = status;

    const products = await Product.find(filter)
      .populate("categoryId", "name")
      // Why populate: replaces categoryId ObjectId with actual
      // category object so we can show category name in table
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
// Why separate from admin: users only see active products
// also supports filtering and pagination for products page
export const getProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, color, size, sort, page = 1, limit = 9 } = req.query;

    // Why start with status active: users never see
    // draft or disabled products
let filter = {
  status: { $in: ["active", "out_of_stock"] }
};

    if (category && category !== "all") {
      // Why lookup category by name: frontend sends category name
      // like "hoodies" but DB stores categoryId (ObjectId)
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

    // Why sort options: matches your frontend sort dropdown
    let sortOption = {};
    if (sort === "price-low") sortOption = { price: 1 };
    else if (sort === "price-high") sortOption = { price: -1 };
    else if (sort === "newest") sortOption = { createdAt: -1 };
    else sortOption = { createdAt: -1 }; // default

    // Why pagination: don't send all products at once
    // send 9 at a time for the products grid
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
// ✅ GET SINGLE PRODUCT (Public)
// ==============================
// Why: product.html page needs full product details
// when user clicks on a product card
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
// Why: admin clicks edit button on product row in table
export const updateProduct = async (req, res) => {
  try {
    const { name, description, price, salePrice, categoryId, sizes, colors, stock } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Why only update images if new ones uploaded:
    // keeps existing images if admin doesn't upload new ones
    if (req.files && req.files.length > 0) {
      // Delete old images from Cloudinary to save storage
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
// Why toggle not delete: same pattern as categories
// admin can disable a product without losing its data
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
import Category from "../models/categoryModel.js";
import cloudinary from "../config/cloudinary.js";

// ==============================
// ✅ CREATE CATEGORY (Admin only)
// ==============================
// Why: admin clicks "Add Category" button in admin-categories.html
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Why: catch empty name before hitting database
    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    // Why: prevent duplicate category names like two "Hoodies"
    const exists = await Category.findOne({ name });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    // Why req.file.path: multer-storage-cloudinary automatically
    // uploads to Cloudinary and puts the URL in req.file.path
    const image = req.file ? req.file.path : "";

    const category = await Category.create({ name, description, image });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================
// ✅ GET ALL CATEGORIES (Public)
// ==============================
// Why public: user-side filter buttons need category list
// even non-logged-in users must see them
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ status: "active" }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================
// ✅ GET ALL CATEGORIES FOR ADMIN
// ==============================
// Why separate: admin-categories.html needs ALL categories
// including disabled ones so admin can re-enable them
export const getAdminCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================
// ✅ UPDATE CATEGORY (Admin only)
// ==============================
// Why: admin clicks the pencil edit button on each category card
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Why: catch empty name before hitting database
    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Why: only replace image if admin uploaded a new one
    // otherwise keep the existing image URL
    if (req.file) {
      if (category.image) {
        const publicId = category.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`dripmen-products/${publicId}`);
      }
      category.image = req.file.path;
    }

    category.name = name || category.name;
    category.description = description || category.description;

    await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================
// ✅ TOGGLE STATUS (Admin only)
// ==============================
// Why: matches the Enable/Disable button in your
// admin-categories.html — no delete, just toggle status
export const toggleCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Why: if currently active → make inactive, and vice versa
    category.status = category.status === "active" ? "inactive" : "active";

    await category.save();

    res.status(200).json({
      success: true,
      message: `Category ${category.status === "active" ? "enabled" : "disabled"} successfully`,
      status: category.status,
      category,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
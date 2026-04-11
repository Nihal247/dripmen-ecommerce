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

    // Case-insensitive duplicate check
    const exists = await Category.findOne({ 
      name: { $regex: new RegExp("^" + name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } 
    });
    
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists (case-insensitive check)",
      });
    }

    // Why req.file.path: multer-storage-cloudinary automatically
    // uploads to Cloudinary and puts the URL in req.file.path
    const image = req.file ? req.file.path : "";

// generate slug from name
const slug = name
  .toLowerCase()
  .replace(/\s+/g, "-");

// prevent duplicate slug (case-insensitive)
const slugExists = await Category.findOne({ 
  slug: { $regex: new RegExp("^" + slug + "$", "i") } 
});
if (slugExists) {
  return res.status(400).json({
    success: false,
    message: "Category slug already exists",
  });
}

const category = await Category.create({
  name,
  slug,
  description,
  image
});

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

    const { removeImage } = req.body;

    if (removeImage === "true" || req.file) {
      if (category.image) {
        try {
          const publicId = category.image.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(`dripmen-products/${publicId}`);
        } catch (err) {
          console.error("Cloudinary delete error:", err);
        }
        category.image = "";
      }
      
      if (req.file) {
        category.image = req.file.path;
      }
    }

    if (name && name !== category.name) {
      // Check for duplicates before renaming (case-insensitive)
      const exists = await Category.findOne({ 
        _id: { $ne: id },
        name: { $regex: new RegExp("^" + name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") } 
      });
      
      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Another category already has this name",
        });
      }

      category.name = name.trim();
      category.slug = name.trim().toLowerCase().replace(/\s+/g, "-");
    }

    category.description = description || category.description;

    await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};
// ==============================
// ✅ TOGGLE STATUS (Admin only)
// ==============================
// Why: matches the Enable/Disable button in your
// admin-categories.html — no delete, just toggle status
export const toggleCategoryStatus = async (req, res) => {
  try {

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    category.status =
      category.status === "active" ? "inactive" : "active";

    await category.save();

    res.json({
      success: true,
      status: category.status
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// ==============================
// ✅ DELETE CATEGORY (Admin only)
// ==============================
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Delete image from Cloudinary if it exists
    if (category.image) {
      try {
        const publicId = category.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`dripmen-products/${publicId}`);
      } catch (err) {
        console.error("Cloudinary delete error:", err);
      }
    }

    await Category.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

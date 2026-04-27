import mongoose from "mongoose";
import Product from "../models/Product.js";
import Category from "../models/categoryModel.js";
import Banner from "../models/bannerModel.js";
import cloudinary from "../config/cloudinary.js";
import { publicCache } from "../utils/cache.js";

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
      try { 
        const parsed = JSON.parse(section);
        parsedSection = Array.isArray(parsed) ? parsed : [parsed];
      } catch(e) { 
        parsedSection = section.split(",").map(s => s.trim());
      }
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
    const { search, category, status, page = 1, limit = 10 } = req.query;

    let filter = {};
    if (search) filter.name = { $regex: search, $options: "i" };
    if (category) filter.categoryId = category;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .populate("categoryId", "name")
      .sort({ createdAt: -1, _id: 1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
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
// ✅ GET ALL PRODUCTS (User/Public)
// ==============================
export const getProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, color, size, sort, section, search, page = 1, limit = 12 } = req.query;

    const pNum = Math.max(1, parseInt(page) || 1);
    const pLimit = Math.max(1, parseInt(limit) || 12);
    const skip = (pNum - 1) * pLimit;

    let filter = {
      status: { $in: ["active", "out_of_stock"] }
    };

    if (search) filter.name = { $regex: search, $options: "i" };
    
    if (section) {
      const safeSection = section.replace(/_/g, ".*");
      filter.section = { $regex: new RegExp(safeSection, "i") };
    }

    if (category && category !== "all") {
      const cat = await Category.findOne({
        $or: [
          { name: { $regex: new RegExp("^" + category + "$", "i") } },
          { slug: { $regex: new RegExp("^" + category + "$", "i") } }
        ]
      });
      if (cat) filter.categoryId = cat._id;
      else filter.categoryId = new mongoose.Types.ObjectId("000000000000000000000000");
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (color && color !== "all") filter.colors = color;
    if (size && size !== "all") filter["sizes.size"] = size;

    let sortOption = {};
    if (sort === "price-low") sortOption = { price: 1, _id: 1 };
    else if (sort === "price-high") sortOption = { price: -1, _id: 1 };
    else if (sort === "newest") sortOption = { createdAt: -1, _id: 1 };
    else if (sort === "top-selling") sortOption = { sales: -1, _id: 1 };
    else sortOption = { createdAt: -1, _id: 1 };

    // Use Aggregation to ensure count and data are perfectly synced
    const pipeline = [
      { $match: filter },
      {
        $facet: {
          totalData: [{ $count: "count" }],
          results: [
            { $sort: sortOption },
            { $skip: skip },
            { $limit: pLimit },
            {
              $lookup: {
                from: "categories",
                localField: "categoryId",
                foreignField: "_id",
                as: "categoryId"
              }
            },
            { $unwind: { path: "$categoryId", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                name: 1,
                price: 1,
                salePrice: 1,
                images: 1,
                status: 1,
                stock: 1,
                section: 1,
                "categoryId.name": 1,
                "categoryId._id": 1,
                createdAt: 1,
                sales: 1,
                sizes: 1
              }
            }
          ]
        }
      }
    ];

    const [aggregationResult] = await Product.aggregate(pipeline);
    const total = aggregationResult.totalData[0]?.count || 0;
    const products = aggregationResult.results;

    res.status(200).json({
      success: true,
      total,
      totalPages: Math.ceil(total / pLimit),
      currentPage: pNum,
      limit: pLimit,
      products,
    });
  } catch (error) {
    console.error("getProducts Error:", error);
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

    // Handle Images
    let currentImages = product.images || [];
    const { keepImages } = req.body;
    
    if (keepImages) {
      const imagesToKeep = JSON.parse(keepImages);
      // Delete images from cloudinary that are NOT in imagesToKeep
      const toDelete = currentImages.filter(img => !imagesToKeep.includes(img));
      for (const imageUrl of toDelete) {
        try {
          const publicId = imageUrl.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(`dripmen-products/${publicId}`);
        } catch (err) {
          console.error("Cloudinary delete error:", err);
        }
      }
      currentImages = imagesToKeep;
    }

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((f) => f.path);
      currentImages = [...currentImages, ...newImages];
    }
    
    product.images = currentImages;

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
        const parsed = JSON.parse(section);
        parsedSection = Array.isArray(parsed) ? parsed : [parsed];
      } catch(e) {
        parsedSection = section.split(",").map(s => s.trim());
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
      { returnDocument: 'after' }
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
// ==============================
// ✅ GET HOMEPAGE DATA (Public)
// Aggregates Banners + Sections into ONE response
// ==============================
export const getHomepageData = async (req, res) => {
  try {
    const data = await publicCache.getOrSet("homepage_data", async () => {
      // 1. Fetch Banners
      const banners = await Banner.find({ isActive: true }).sort({ createdAt: -1 });

      // 2. Fetch New Arrivals
      const newArrivals = await Product.find({
        status: { $in: ["active", "out_of_stock"] },
        section: "new_arrivals"
      })
      .select("name price salePrice images status stock section createdAt")
      .sort({ createdAt: -1 })
      .limit(4);

      // 3. Fetch Top Selling
      const topSelling = await Product.find({
        status: { $in: ["active", "out_of_stock"] },
        section: "top_selling"
      })
      .select("name price salePrice images status stock section createdAt")
      .sort({ sales: -1 })
      .limit(4);

      // 4. Fetch Explore
      const explore = await Product.find({
        status: { $in: ["active", "out_of_stock"] },
        section: "explore"
      })
      .select("name price salePrice images status stock section createdAt")
      .sort({ createdAt: -1 })
      .limit(8);

      return {
        banners,
        sections: {
          new_arrivals: newArrivals,
          top_selling: topSelling,
          explore: explore
        }
      };
    });

    res.status(200).json({
      success: true,
      ...data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

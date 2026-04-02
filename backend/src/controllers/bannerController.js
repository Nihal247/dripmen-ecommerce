import Banner from "../models/bannerModel.js";
import cloudinary from "../config/cloudinary.js";

// ✅ CREATE BANNER (Admin)
export const createBanner = async (req, res) => {
  try {
    const { title, link, order } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Banner image is required" });
    }

    const image = req.file.path;

    const banner = await Banner.create({
      title,
      image,
      link,
      order: Number(order) || 0
    });

    res.status(201).json({ success: true, banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ GET ALL BANNERS (Admin)
export const getAdminBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 });
    res.json({ success: true, count: banners.length, banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ GET ACTIVE BANNERS (Public)
export const getPublicBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ UPDATE BANNER (Admin)
export const updateBanner = async (req, res) => {
  try {
    const { title, link, order, isActive } = req.body;
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    if (req.file) {
      // Delete old image from cloudinary
      const publicId = banner.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`dripmen-products/${publicId}`);
      banner.image = req.file.path;
    }

    banner.title = title || banner.title;
    banner.link = link || banner.link;
    banner.order = order !== undefined ? Number(order) : banner.order;
    banner.isActive = isActive !== undefined ? isActive === 'true' || isActive === true : banner.isActive;

    await banner.save();
    res.json({ success: true, banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ DELETE BANNER (Admin)
export const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    // Delete image from cloudinary
    const publicId = banner.image.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(`dripmen-products/${publicId}`);

    await Banner.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Banner deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

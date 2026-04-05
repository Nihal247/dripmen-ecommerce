import Banner from "../models/bannerModel.js";
import cloudinary from "../config/cloudinary.js";

// Helper to extract public ID for Cloudinary deletions
const getPublicId = (url) => {
  if (!url) return null;
  try {
    const parts = url.split("/");
    const filename = parts.pop();
    const folder = parts.pop(); // typically 'dripmen-banners'
    const publicId = filename.split(".")[0];
    return `${folder}/${publicId}`;
  } catch (e) {
    return null;
  }
};

export const createBanner = async (req, res) => {
  try {
    let image = "";

    if (req.file && req.file.path) {
      image = req.file.path;
    } else {
      return res.status(400).json({ success: false, message: "Banner image is required." });
    }

    const { title, link, isActive, order } = req.body;

    const banner = await Banner.create({
      title,
      image,
      link,
      isActive: isActive === 'true' || isActive === true,
      order: Number(order) || 0
    });

    res.status(201).json({ success: true, banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: "Banner not found" });

    let newImage = banner.image;

    // Replace Image
    if (req.file && req.file.path) {
      newImage = req.file.path;
      if (banner.image) {
        const publicId = getPublicId(banner.image);
        if (publicId) await cloudinary.uploader.destroy(publicId).catch(console.error);
      }
    }

    const { title, link, isActive, order } = req.body;

    banner.title = title || banner.title;
    banner.image = newImage;
    banner.link = link !== undefined ? link : banner.link;
    banner.isActive = isActive !== undefined ? (isActive === 'true' || isActive === true) : banner.isActive;
    banner.order = order !== undefined ? Number(order) : banner.order;

    await banner.save();
    res.json({ success: true, banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: "Banner not found" });

    // Clean up image from Cloudinary
    if (banner.image) {
      const publicId = getPublicId(banner.image);
      if (publicId) await cloudinary.uploader.destroy(publicId).catch(console.error);
    }

    await Banner.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Banner deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 });
    res.json({ success: true, count: banners.length, banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPublicBanners = async (req, res) => {
  try {
    // Only return banners where isActive: true
    const banners = await Banner.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleBannerStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const banner = await Banner.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    res.json({ success: true, banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const recordClick = async (req, res) => {
  try {
    await Banner.findByIdAndUpdate(req.params.id, { $inc: { clicks: 1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

export const recordView = async (req, res) => {
  try {
    await Banner.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

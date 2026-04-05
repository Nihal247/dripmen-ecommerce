import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import cloudinary from "../config/cloudinary.js"; 

const bannerStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "dripmen-banners",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
  },
});

export const uploadBanner = multer({ storage: bannerStorage });

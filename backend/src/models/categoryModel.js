import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      // Why unique: you don't want two categories called "Hoodies"
    },

    description: {
      type: String,
      trim: true,
    },

    image: {
      type: String,
      // Why String: Cloudinary gives back a URL like
      // "https://res.cloudinary.com/dw6l4mcnk/image/upload/..."
      // we just save that URL here
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      // Why enum: only these two values are allowed
      // prevents someone sending status: "deleted" or any random value
    },
  },
  { timestamps: true }
  // Why timestamps: automatically adds createdAt and updatedAt
  // you need this for your admin panel sorting
);

const Category = mongoose.model("Category", categorySchema);

export default Category;
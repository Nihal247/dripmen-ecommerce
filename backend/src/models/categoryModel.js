import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
{
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },

  slug: {
    type: String,
    required: true,
    unique: true
    // used for URLs and filtering
    // example: "t-shirts"
  },

  description: {
    type: String,
    trim: true
  },

  image: {
    type: String
  },

  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"
  }

},
{ timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);

export default Category;
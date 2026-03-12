import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  description: {
    type: String
  },

  price: {
    type: Number,
    required: true
  },

  salePrice: {
    type: Number
  },

  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category"
  },

  images: [
    {
      type: String
    }
  ],

  sizes: [
    {
      type: String
    }
  ],

  colors: [
    {
      type: String
    }
  ],

  stock: {
    type: Number,
    default: 0
  },

  status: {
  type: String,
  enum: ["active", "inactive", "draft", "out_of_stock"],
  default: "draft"
},
sales: {
  type: Number,
  default: 0
}

}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);

export default Product;
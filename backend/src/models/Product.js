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
      size: { type: String, required: true },
      stock: { type: Number, default: 0 }
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
},

// Which homepage sections this product appears in
// e.g. ["new_arrivals", "top_selling", "explore"]
section: {
  type: [String],
  default: []
}

}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);

export default Product;
import mongoose from "mongoose";

const wishlistItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
<<<<<<< HEAD
  },
  size: {
    type: String,
    default: "N/A"
=======
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
  }
}, { _id: false });

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true // one wishlist per user
  },
  items: [wishlistItemSchema]
}, { timestamps: true });

const Wishlist = mongoose.model("Wishlist", wishlistSchema);
export default Wishlist;
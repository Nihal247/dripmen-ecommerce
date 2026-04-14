import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
<<<<<<< HEAD
    size: {
      type: String,
      required: true,
      default: "N/A",
    },
    color: {
      type: String,
      required: true,
      default: "Black",
    },
  }
=======
  },
  { _id: false }
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one cart per user
    },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
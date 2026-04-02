import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  name:     { type: String, required: true },
  image:    { type: String },
  price:    { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  size:     { type: String, default: "L" },
  color:    { type: String, default: "Black" }
}, { _id: false });

const addressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone:    { type: String, required: true },
  street:   { type: String, required: true },
  city:     { type: String, required: true },
  state:    { type: String },
  zip:      { type: String },
  country:  { type: String, default: "India" }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  items:          [orderItemSchema],
  address:        addressSchema,
  paymentMethod:  { type: String, default: "COD" },
  paymentStatus:  {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending"
  },
  orderStatus: {
    type: String,
    enum: ["processing", "confirmed", "shipped", "delivered", "cancelled"],
    default: "processing"
  },
  subtotal:      { type: Number, required: true },
  deliveryCharge:{ type: Number, default: 0 },
  total:         { type: Number, required: true },
  couponCode:    { type: String },
  discount:      { type: Number, default: 0 },
  notes:         { type: String },
  paymentId:       { type: String },
razorpayOrderId: { type: String }
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);
export default Order;
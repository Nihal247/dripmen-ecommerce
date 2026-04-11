import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  name:     { type: String, required: true },
  image:    { type: String },
  mrp:      { type: Number }, // Original price
  price:    { type: Number, required: true }, // Paid price (SalePrice or MRP)
  quantity: { type: Number, required: true, default: 1 },
  size:     { type: String, default: "L" },
  color:    { type: String, default: "Black" },
  status: {
    type: String,
    enum: ["processing", "confirmed", "shipped", "delivered", "cancelled", "returned"],
    default: "processing"
  },
  returnStatus: {
    type: String,
    enum: ["none", "requested", "approved", "rejected"],
    default: "none"
  },
  returnReason: { type: String },
  refundAmount: { type: Number, default: 0 }
}, { _id: true });

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
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending"
  },
  orderStatus: {
    type: String,
    enum: ["processing", "confirmed", "shipped", "delivered", "cancelled", "returned"],
    default: "processing"
  },
  subtotal:      { type: Number, required: true },
  totalMRP:      { type: Number },
  productDiscount: { type: Number, default: 0 },
  deliveryCharge:{ type: Number, default: 0 },
  total:         { type: Number, required: true },
  couponCode:    { type: String },
  discount:      { type: Number, default: 0 },
  notes:         { type: String },
  returnStatus: {
    type: String,
    enum: ["none", "requested", "approved", "rejected"],
    default: "none"
  },
  returnReason:  { type: String },
  refundMethod: {
    type: String,
    enum: ["wallet", "original"],
    default: "wallet"
  },
  paymentId:       { type: String },
razorpayOrderId: { type: String }
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);
export default Order;
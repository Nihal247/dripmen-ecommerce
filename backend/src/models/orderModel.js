import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  name:     { type: String, required: true },
  image:    { type: String },
<<<<<<< HEAD
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
=======
  price:    { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  size:     { type: String, default: "L" },
  color:    { type: String, default: "Black" }
}, { _id: false });
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920

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
<<<<<<< HEAD
    enum: ["pending", "paid", "failed", "refunded"],
=======
    enum: ["pending", "paid", "failed"],
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
    default: "pending"
  },
  orderStatus: {
    type: String,
<<<<<<< HEAD
    enum: ["processing", "confirmed", "shipped", "delivered", "cancelled", "returned"],
    default: "processing"
  },
  subtotal:      { type: Number, required: true },
  totalMRP:      { type: Number },
  productDiscount: { type: Number, default: 0 },
=======
    enum: ["processing", "confirmed", "shipped", "delivered", "cancelled"],
    default: "processing"
  },
  subtotal:      { type: Number, required: true },
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
  deliveryCharge:{ type: Number, default: 0 },
  total:         { type: Number, required: true },
  couponCode:    { type: String },
  discount:      { type: Number, default: 0 },
<<<<<<< HEAD
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
=======
  notes:         { type: String }
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);
export default Order;
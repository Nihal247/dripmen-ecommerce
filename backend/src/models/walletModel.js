import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  type: { type: String, enum: ["credit", "debit"], required: true },
  description: { type: String, required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  createdAt: { type: Date, default: Date.now }
});

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  balance: { type: Number, default: 0 },
  transactions: [transactionSchema]
}, { timestamps: true });

const Wallet = mongoose.model("Wallet", walletSchema);
export default Wallet;

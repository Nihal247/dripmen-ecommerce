import mongoose from "mongoose";
import fs from "fs";

const envRaw = fs.readFileSync("/Users/muhammednihal/Desktop/DripMen/backend/.env", "utf8");
const env = Object.fromEntries(
  envRaw.split("\n")
    .filter(l => l.includes("="))
    .map(l => { const [k, ...v] = l.split("="); return [k.trim(), v.join("=").trim()]; })
);

await mongoose.connect(env.MONGO_URI || "mongodb://127.0.0.1:27017/dripmen");

const schema = new mongoose.Schema({
  code: { type: String, unique: true, uppercase: true, trim: true },
  discountType: { type: String, default: "percentage" },
  discountValue: Number,
  minPurchase: { type: Number, default: 0 },
  expiryDate: Date,
  isActive: { type: Boolean, default: true },
  showOnTopBar: { type: Boolean, default: false },
  tag: { type: String, default: "HOT" }
}, { timestamps: true });

const Coupon = mongoose.models.Coupon || mongoose.model("Coupon", schema);

await Coupon.deleteMany({ code: { $in: ["DRIP20", "SUMMER10", "FLASH50"] } });

const now = Date.now();
await Coupon.insertMany([
  { code: "DRIP20",   discountType: "percentage", discountValue: 20, minPurchase: 0,   expiryDate: new Date(now + 30 * 86400000), showOnTopBar: true, tag: "HOT"     },
  { code: "SUMMER10", discountType: "fixed",       discountValue: 10, minPurchase: 50,  expiryDate: new Date(now + 15 * 86400000), showOnTopBar: true, tag: "NEW"     },
  { code: "FLASH50",  discountType: "percentage",  discountValue: 50, minPurchase: 200, expiryDate: new Date(now + 3 * 86400000),  showOnTopBar: true, tag: "LIMITED" }
]);

const seeded = await Coupon.find({ code: { $in: ["DRIP20", "SUMMER10", "FLASH50"] } });
seeded.forEach(c => console.log(
  `✅ ${c.code} | tag:${c.tag} | value:${c.discountValue}${c.discountType === "percentage" ? "%" : "$"} | topBar:${c.showOnTopBar}`
));

await mongoose.disconnect();

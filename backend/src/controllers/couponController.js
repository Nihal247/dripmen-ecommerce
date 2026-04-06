import Coupon from "../models/couponModel.js";

// ✅ CREATE COUPON (ADMIN)
export const createCoupon = async (req, res) => {
  try {
    const couponExists = await Coupon.findOne({ code: req.body.code.toUpperCase() });
    if (couponExists) {
      return res.status(400).json({ success: false, message: "Coupon code already exists" });
    }

    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ GET ALL COUPONS (ADMIN)
export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ GET AVAILABLE COUPONS (PUBLIC/USER)
export const getAvailableCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({
      isActive: true,
      expiryDate: { $gt: Date.now() }
    }).sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ DELETE COUPON (ADMIN)
export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
    res.json({ success: true, message: "Coupon deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ UPDATE COUPON (ADMIN)
export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
    res.json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ APPLY COUPON (USER)
export const applyCoupon = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      expiryDate: { $gt: Date.now() }
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Invalid or expired coupon" });
    }

    if (cartTotal < coupon.minPurchase) {
      return res.status(400).json({
        success: false,
        message: `Min purchase of $${coupon.minPurchase} required for this coupon`
      });
    }

    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = (cartTotal * coupon.discountValue) / 100;
    } else {
      discount = coupon.discountValue;
    }

    // Cap discount at cartTotal
    discount = Math.min(discount, cartTotal);

    res.json({
      success: true,
      discount: Math.round(discount),
      finalTotal: Math.round(cartTotal - discount),
      couponCode: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

import Address from "../models/addressModel.js";

// ✅ GET ALL USER ADDRESSES
export const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user.id }).sort({ isDefault: -1, createdAt: -1 });
    res.json({ success: true, count: addresses.length, addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ ADD NEW ADDRESS
export const addAddress = async (req, res) => {
  try {
    const { name, mobile, email, street, city, zip, isDefault } = req.body;

    // If this is the first address, or isDefault is true
    const count = await Address.countDocuments({ user: req.user.id });
    let shouldBeDefault = isDefault || count === 0;

    if (shouldBeDefault) {
      await Address.updateMany({ user: req.user.id }, { isDefault: false });
    }

    const address = await Address.create({
      user: req.user.id,
      name,
      mobile,
      email,
      street,
      city,
      zip,
      isDefault: shouldBeDefault
    });

    res.status(201).json({ success: true, address });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ UPDATE ADDRESS
export const updateAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user.id });

    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    if (req.body.isDefault && !address.isDefault) {
      await Address.updateMany({ user: req.user.id }, { isDefault: false });
    }

    Object.assign(address, req.body);
    await address.save();

    res.json({ success: true, address });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ DELETE ADDRESS
export const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user.id });

    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    // If we deleted the default, set the next one as default
    if (address.isDefault) {
      const nextOne = await Address.findOne({ user: req.user.id });
      if (nextOne) {
        nextOne.isDefault = true;
        await nextOne.save();
      }
    }

    res.json({ success: true, message: "Address removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ SET DEFAULT
export const setDefaultAddress = async (req, res) => {
  try {
    await Address.updateMany({ user: req.user.id }, { isDefault: false });
    
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isDefault: true },
      { returnDocument: 'after' }
    );

    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    res.json({ success: true, address });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

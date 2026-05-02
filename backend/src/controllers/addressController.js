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

    // Validations
    const nameRegex = /^[A-Za-z]{2,50}(?:\s[A-Za-z]{1,50})*$/;
    const emailRegex = /^[a-zA-Z0-9]+(?:[._+-][a-zA-Z0-9]+)*@(?![0-9]+\.)[a-zA-Z0-9]+(?:[.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/i;
    const phoneRegex = /^\+?[\d\s-]{10,15}$/;
    const zipRegex = /^[A-Za-z0-9\s-]{3,10}$/;

    if (!name || !nameRegex.test(name.trim())) {
      return res.status(400).json({ success: false, message: "Valid name is required (letters only, 2-50 chars)" });
    }
    if (!mobile || !phoneRegex.test(mobile.trim())) {
      return res.status(400).json({ success: false, message: "Valid mobile number is required" });
    }
    if (email && !emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: "Valid email is required" });
    }
    if (!street || street.trim().length < 3) {
      return res.status(400).json({ success: false, message: "Valid street address is required" });
    }
    if (!city || city.trim().length < 2) {
      return res.status(400).json({ success: false, message: "Valid city is required" });
    }
    if (!zip || !zipRegex.test(zip.trim())) {
      return res.status(400).json({ success: false, message: "Valid ZIP/Postal code is required" });
    }

    // If this is the first address, or isDefault is true
    const count = await Address.countDocuments({ user: req.user.id });
    let shouldBeDefault = isDefault || count === 0;

    if (shouldBeDefault) {
      await Address.updateMany({ user: req.user.id }, { isDefault: false });
    }

    const address = await Address.create({
      user: req.user.id,
      name: name.trim(),
      mobile: mobile.trim(),
      email: email ? email.trim() : "",
      street: street.trim(),
      city: city.trim(),
      zip: zip.trim(),
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

    const { name, mobile, email, street, city, zip, isDefault } = req.body;

    const nameRegex = /^[A-Za-z]{2,50}(?:\s[A-Za-z]{1,50})*$/;
    const emailRegex = /^[a-zA-Z0-9]+(?:[._+-][a-zA-Z0-9]+)*@(?![0-9]+\.)[a-zA-Z0-9]+(?:[.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/i;
    const phoneRegex = /^\+?[\d\s-]{10,15}$/;
    const zipRegex = /^[A-Za-z0-9\s-]{3,10}$/;

    if (name && !nameRegex.test(name.trim())) {
      return res.status(400).json({ success: false, message: "Valid name is required (letters only, 2-50 chars)" });
    }
    if (mobile && !phoneRegex.test(mobile.trim())) {
      return res.status(400).json({ success: false, message: "Valid mobile number is required" });
    }
    if (email && !emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: "Valid email is required" });
    }
    if (street && street.trim().length < 3) {
      return res.status(400).json({ success: false, message: "Valid street address is required" });
    }
    if (city && city.trim().length < 2) {
      return res.status(400).json({ success: false, message: "Valid city is required" });
    }
    if (zip && !zipRegex.test(zip.trim())) {
      return res.status(400).json({ success: false, message: "Valid ZIP/Postal code is required" });
    }

    if (isDefault && !address.isDefault) {
      await Address.updateMany({ user: req.user.id }, { isDefault: false });
    }

    if (name) address.name = name.trim();
    if (mobile) address.mobile = mobile.trim();
    if (email !== undefined) address.email = email ? email.trim() : "";
    if (street) address.street = street.trim();
    if (city) address.city = city.trim();
    if (zip) address.zip = zip.trim();
    if (isDefault !== undefined) address.isDefault = isDefault;

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

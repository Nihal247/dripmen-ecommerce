import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const adminLogin = async (req, res) => {
  try {

    const { email, password } = req.body;


    // find user
const admin = await User.findOne({ email }).select("+password");


    if (!admin) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // check admin role
    if (!admin.is_Admin) {
      return res.status(403).json({
        message: "Not an admin"
      });
    }

    // check password
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid password"
      });
    }

    // create token
    const token = jwt.sign(
{ id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      admin
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
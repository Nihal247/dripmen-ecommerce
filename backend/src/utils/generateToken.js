import jwt from "jsonwebtoken";

const generateToken = (userId, isAdmin = false) => {
  return jwt.sign(
    { id: userId, is_Admin: isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export default generateToken;
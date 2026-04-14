import jwt from "jsonwebtoken";

const generateToken = (userId, isAdmin = false) => {
  return jwt.sign(
<<<<<<< HEAD
    { id: userId, isAdmin: isAdmin },
=======
    { id: userId, is_Admin: isAdmin },
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export default generateToken;
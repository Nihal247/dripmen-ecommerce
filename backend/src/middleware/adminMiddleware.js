
// export const adminOnly = (req, res, next) => {
// console.log("ADMIN CHECK:", req.user); 

//   if (!req.user) {
//     return res.status(401).json({
//       message: "Not authorized"
//     });
//   }

//   if (req.user.role !== "admin") {
//     return res.status(403).json({
//       message: "Admin access only"
//     });
//   }

//   next();

// };

export const adminOnly = (req, res, next) => {
<<<<<<< HEAD
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: "Admin access only" });
=======
console.log("ADMIN CHECK:", req.user); 

  if (!req.user) {
    return res.status(401).json({
      message: "Not authorized"
    });
>>>>>>> 517f3a4a938f3f8caf65d9cdcafe9a623a138920
  }
  next();
};
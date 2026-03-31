import bcrypt from "bcryptjs";

const run = async () => {
  const hashed = await bcrypt.hash("Nih@lm21", 10);
  console.log(hashed);
};

run();
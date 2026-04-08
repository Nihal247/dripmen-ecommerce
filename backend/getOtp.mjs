import mongoose from "mongoose";
import dotenv from "dotenv";
import OTP from "./src/models/otpModel.js";

dotenv.config();

async function getLatestOtp() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const otpRecord = await OTP.findOne({ email: "qa_test_user@example.com" }).sort({ createdAt: -1 });
    if (otpRecord) {
      console.log(`OTP for qa_test_user@example.com: ${otpRecord.otp}`);
    } else {
      console.log("No OTP found for the given email.");
    }
    await mongoose.disconnect();
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

getLatestOtp();

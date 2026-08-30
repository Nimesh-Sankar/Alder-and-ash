import User from "../models/userModel.js";
import OTP from "../models/otpModel.js";
import bcrypt from "bcrypt";
import STATUS_CODES from "../constants/statusCodes.js";


export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: "User not found" });
    }

    
    const generateOTP = () => {
      return Math.floor(100000 + Math.random() * 900000).toString();
    };

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    
    await OTP.deleteMany({ email, purpose: "forgotPassword" });

    const newOTP = new OTP({
      email,
      otp,
      purpose: "forgotPassword",
      expiresAt,
    });

    await newOTP.save();

    console.log(`Password reset OTP for ${email}: ${otp}`);

    res.json({
      success: true,
      message: "Password reset OTP sent successfully",
      otp: otp 
    });
  } catch (error) {
    console.log("FORGOT PASSWORD ERROR:", error.message);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};


export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

  
    const otpRecord = await OTP.findOne({
      email,
      otp,
      purpose: "forgotPassword",
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Invalid or expired OTP" });
    }

    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: "User not found" });
    }

    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    
    await OTP.deleteOne({ _id: otpRecord._id });

    res.json({
      success: true,
      message: "Password reset successfully"
    });
  } catch (error) {
    console.log("RESET PASSWORD ERROR:", error.message);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
  }
};
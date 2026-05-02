import OTP from "../models/otpModel.js";

// Generate random OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP
export const sendOTP = async (req, res) => {
  try {
    const { email, purpose } = req.body; // purpose: "signup", "forgotPassword", "emailChange"

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete old OTPs for this email and purpose
    await OTP.deleteMany({ email, purpose });

    const newOTP = new OTP({
      email,
      otp,
      purpose,
      expiresAt,
    });

    await newOTP.save();

    console.log(`OTP for ${email} (${purpose}): ${otp}`);

    res.json({ 
      message: "OTP sent successfully", 
      otp: otp // Remove in production
    });
  } catch (error) {
    console.log("SEND OTP ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp, purpose } = req.body;

    // Find valid OTP
    const otpRecord = await OTP.findOne({
      email,
      otp,
      purpose,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Delete used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    res.json({ 
      message: "OTP verified successfully",
      verified: true
    });
  } catch (error) {
    console.log("VERIFY OTP ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const { email, purpose } = req.body;

    const newOtp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OTP.deleteMany({ email, purpose });

    const otpRecord = new OTP({
      email,
      otp: newOtp,
      purpose,
      expiresAt,
    });

    await otpRecord.save();

    console.log(`Resent OTP for ${email} (${purpose}): ${newOtp}`);

    res.json({ 
      message: "OTP resent successfully",
      otp: newOtp // Remove in production
    });
  } catch (error) {
    console.log("RESEND OTP ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
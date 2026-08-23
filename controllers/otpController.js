import "dotenv/config";
import OTP from "../models/otpModel.js";
import nodemailer from "nodemailer";

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOTP = async (req, res) => {
  try {
    const { email, purpose } = req.body;

    const otp = generateOTP();

    const expiresAt = new Date(Date.now() + 30 * 1000);

    await OTP.deleteMany({ email, purpose });

    const newOTP = new OTP({
      email,
      otp,
      purpose,
      expiresAt,
    });

    await newOTP.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Alder & Ash - Verification OTP",
      text: `Your verification OTP is ${otp}.`,
    });

    console.log(`OTP for ${email} (${purpose}): ${otp}`);

    res.json({
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.log("SEND OTP ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp, purpose } = req.body;

    console.log("verify Body", req.body);

    const existingOtp = await OTP.findOne({
      email,
      purpose,
    });

    console.log("OTP IN DB:", existingOtp);

    const otpRecord = await OTP.findOne({
      email,
      otp,
      purpose,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    await OTP.deleteOne({ _id: otpRecord._id });

    res.json({
      message: "OTP verified successfully",
      verified: true,
    });
  } catch (error) {
    console.log("VERIFY OTP ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

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

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Alder & Ash - Verification OTP",
      text: `Your verification OTP is ${newOtp}.`,
    });

    console.log(`Resent OTP for ${email} (${purpose}): ${newOtp}`);

    res.json({
      message: "OTP resent successfully",
    });
  } catch (error) {
    console.log("RESEND OTP ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
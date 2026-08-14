import User from "../models/userModel.js";
import bcrypt from "bcrypt";


export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({
      message: "User profile fetched successfully",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      }
    });
  } catch (error) {
    console.log("GET PROFILE ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, phone, email, profileImage } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        phone,
        email,
        profileImage,
      },
      {
        returnDocument: "after",
        runValidators: true
      }
    ).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.log("UPDATE PROFILE ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
    
    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.log("CHANGE PASSWORD ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Send email verification OTP
export const sendEmailVerification = async (req, res) => {
  try {
    const { userId, newEmail } = req.body;
    
    
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(400).json({ message: "Email already in use" });
    }
    
    // OTP generate
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
  
    
    console.log(`Email verification OTP for new email ${newEmail}: ${otp}`);
    
    res.json({ 
      message: "Verification OTP sent to new email",
      otp: otp 
    });
  } catch (error) {
    console.log("SEND EMAIL VERIFICATION ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyEmailChange = async (req, res) => {
  try {
    const { userId, newEmail, otp } = req.body;
    

    
    const user = await User.findByIdAndUpdate(
      userId,
      { email: newEmail, isEmailVerified: true },
      { returnDocument: "after" }
    ).select("-password");
    
    res.json({
      message: "Email verified and updated successfully",
      user,
    });
  } catch (error) {
    console.log("VERIFY EMAIL CHANGE ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
export const renderWallet = (req, res) => {
  res.render("user/wallet");
};
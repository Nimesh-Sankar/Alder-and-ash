import bcrypt from "bcrypt";
import User from "../models/userModel.js";

export const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
    });

    await user.save();
    req.session.user = {
      id: user._id,
      email: user.email,
    };
  
    res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: user._id,
        firstName: user.firstName,
        email: user.email,
      },
    });

  } catch (error) {
    console.log("SIGNUP ERROR:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    
    if (user.isBlocked) {
      return res.status(403).json({ message: "User is blocked" });
    }

  
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    req.session.user = {
      id: user._id,
      email: user.email,
    };

    
    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        firstName: user.firstName,
        email: user.email,
      },
    });

  } catch (error) {
    console.log("LOGIN ERROR:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    res.status(200).json({
      message: "Users fetched successfully",
      users,
    });

  } catch (error) {
    console.log("GET USERS ERROR:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};
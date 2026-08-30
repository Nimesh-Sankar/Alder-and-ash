import bcrypt from "bcrypt";
import User from "../models/userModel.js";
import STATUS_CODES from "../constants/statusCodes.js";

export const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ message: "User already exists" });
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
  
    res.status(STATUS_CODES.CREATED).json({
      message: "User registered successfully",
      user: {
        _id: user._id,
        firstName: user.firstName,
        email: user.email,
      },
    });

  } catch (error) {
    console.log("SIGNUP ERROR:", error.message);

    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: "Server error",
    });
  }
};
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: "User not found" });
    }

    
    if (user.isBlocked) {
      return res.status(STATUS_CODES.FORBIDDEN).json({ message: "User is blocked" });
    }

  
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({ message: "Invalid credentials" });
    }
    req.session.user = {
      id: user._id,
      email: user.email,
    };

    
    res.status(STATUS_CODES.OK).json({
      message: "Login successful",
      user: {
        _id: user._id,
        firstName: user.firstName,
        email: user.email,
      },
    });

  } catch (error) {
    console.log("LOGIN ERROR:", error.message);

    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: "Server error",
    });
  }
};
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    res.status(STATUS_CODES.OK).json({
      message: "Users fetched successfully",
      users,
    });

  } catch (error) {
    console.log("GET USERS ERROR:", error.message);

    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: "Server error",
    });
  }
};
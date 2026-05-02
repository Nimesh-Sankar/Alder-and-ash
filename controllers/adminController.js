import User from "../models/userModel.js";

// Block/Unblock user with confirmation
export const toggleBlockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action } = req.body; // 'block' or 'unblock'

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (action === "block") {
      user.isBlocked = true;
      await user.save();
      res.json({ message: "User blocked successfully", isBlocked: true });
    } else if (action === "unblock") {
      user.isBlocked = false;
      await user.save();
      res.json({ message: "User unblocked successfully", isBlocked: false });
    } else {
      res.status(400).json({ message: "Invalid action" });
    }
  } catch (error) {
    console.log("TOGGLE BLOCK ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Get users with search, pagination, sorting (already descending from your getUsers)
export const getUsersWithFilters = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    // Build search query
    let query = {};
    if (search) {
      query = {
        $or: [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      };
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 }) // Descending order (latest first)
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments(query);

    res.json({
      users,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
      hasNextPage: page < Math.ceil(totalUsers / limit),
      hasPrevPage: page > 1,
    });
  } catch (error) {
    console.log("GET USERS FILTER ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin sign in (separate from user login)
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await User.findOne({ email, isAdmin: true });
    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      message: "Admin login successful",
      admin: {
        id: admin._id,
        name: `${admin.firstName} ${admin.lastName}`,
        email: admin.email,
      },
    });
  } catch (error) {
    console.log("ADMIN LOGIN ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
import User from "../models/userModel.js";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import bcrypt from "bcrypt";

// Block/Unblock 
export const toggleBlockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action } = req.body; 

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


export const getUsersWithFilters = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    
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
      .sort({ createdAt: -1 }) 
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

export const adminLogin = async (req, res) => {
  try {

      const { email, password } = req.body;

      const admin = await User.findOne({
          email,
          isAdmin: true
      });

      if (!admin) {
          return res.status(401).json({
              message: "Admin not found"
          });
      }

      const isMatch = await bcrypt.compare(
          password,
          admin.password
      );

      if (!isMatch) {
          return res.status(401).json({
              message: "Invalid credentials"
          });
      }

      req.session.admin = {
          id: admin._id,
          email: admin.email
      };

      // Explicitly save session
      req.session.save((err) => {

          if (err) {
              console.log(
                  "ADMIN SESSION SAVE ERROR:",
                  err
              );

              return res.status(500).json({
                  message: "Session error"
              });
          }

          res.json({
              message: "Admin login successful",
              admin: {
                  id: admin._id,
                  name: `${admin.firstName} ${admin.lastName}`,
                  email: admin.email
              }
          });

      });

  } catch (error) {

      console.log(
          "ADMIN LOGIN ERROR:",
          error.message
      );

      res.status(500).json({
          message: "Server error"
      });
  }
};
export const getDashboardStats = async (req, res) => {
  try {

    const totalUsers =
      await User.countDocuments({
        isAdmin: { $ne: true }
      });

    const totalProducts =
      await Product.countDocuments({
        isDeleted: { $ne: true }
      });

    const totalOrders =
      await Order.countDocuments({
        status: {
          $ne: "ORDER_FAILED"
        }
      });

    const revenueData =
      await Order.aggregate([
        {
          $match: {
            status: "DELIVERED"
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: {
                $subtract: [
                  "$grandTotal",
                  {
                    $ifNull: [
                      "$refundedAmount",
                      0
                    ]
                  }
                ]
              }
            }
          }
        }
      ]);

    const totalRevenue =
      revenueData[0]?.totalRevenue || 0;

    const recentOrders =
      await Order.find({
        status: {
          $ne: "ORDER_FAILED"
        }
      })
      .populate("user")
      .sort({
        createdAt: -1
      })
      .limit(5);

    return res.status(200).json({
      success: true,

      data: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
        recentOrders
      }
    });

  } catch (error) {

    console.log(
      "DASHBOARD STATS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load dashboard"
    });
  }
};
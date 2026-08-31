import User from "../models/userModel.js";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import bcrypt from "bcrypt";
import STATUS_CODES from "../constants/statusCodes.js";


export const toggleBlockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        message: "User not found"
      });
    }

    if (action === "block") {
      user.isBlocked = true;
      await user.save();

      return res.status(STATUS_CODES.OK).json({
        message: "User blocked successfully",
        isBlocked: true
      });
    }

    if (action === "unblock") {
      user.isBlocked = false;
      await user.save();

      return res.status(STATUS_CODES.OK).json({
        message: "User unblocked successfully",
        isBlocked: false
      });
    }

    return res.status(STATUS_CODES.BAD_REQUEST).json({
      message: "Invalid action"
    });

  } catch (error) {
    console.log("TOGGLE BLOCK ERROR:", error.message);

    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: "Server error"
    });
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
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Server error" });
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
          return res.status(STATUS_CODES.UNAUTHORIZED).json({
              message: "Admin not found"
          });
      }

      const isMatch = await bcrypt.compare(
          password,
          admin.password
      );

      if (!isMatch) {
          return res.status(STATUS_CODES.UNAUTHORIZED).json({
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

              return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
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

      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
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
        .populate(
          "user",
          "firstName lastName email"
        )
        .sort({
          createdAt: -1
        })
        .limit(5);


// -------------------------
// SALES - LAST 7 DAYS
// -------------------------

const sevenDaysAgo = new Date();

sevenDaysAgo.setDate(
  sevenDaysAgo.getDate() - 6
);

sevenDaysAgo.setHours(
  0,
  0,
  0,
  0
);


const salesData =
  await Order.aggregate([

    {
      $match: {

        status: {
          $nin: [
            "ORDER_FAILED",
            "CANCELLED"
          ]
        },

        createdAt: {
          $gte: sevenDaysAgo
        }
      }
    },

    {
      $group: {

        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt",
            timezone: "+05:30"
          }
        },

        revenue: {
          $sum: "$grandTotal"
        }
      }
    },

    {
      $sort: {
        _id: 1
      }
    }
  ]);


console.log(
  "SALES DATA:",
  salesData
);


// -------------------------
// CREATE ALL 7 DAYS
// -------------------------

const salesLast7Days = [];


for (let i = 0; i < 7; i++) {

  const date =
    new Date(sevenDaysAgo);

  date.setDate(
    sevenDaysAgo.getDate() + i
  );


  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");


  const dateKey =
    `${year}-${month}-${day}`;


  const found =
    salesData.find(
      item =>
        item._id === dateKey
    );


  salesLast7Days.push({

    date: dateKey,

    label:
      date.toLocaleDateString(
        "en-US",
        {
          weekday: "short"
        }
      ),

    revenue:
      found?.revenue || 0
  });
}


console.log(
  "FINAL SALES:",
  salesLast7Days
);



    const topBrands =
      await Order.aggregate([

        {
          $match: {
            status: "DELIVERED"
          }
        },

        {
          $unwind: "$items"
        },

        {
          $match: {
            "items.status": {
              $nin: [
                "CANCELLED",
                "RETURNED"
              ]
            }
          }
        },

        {
          $lookup: {
            from: "products",
            localField: "items.product",
            foreignField: "_id",
            as: "product"
          }
        },

        {
          $unwind: "$product"
        },

        {
          $lookup: {
            from: "brands",
            localField: "product.brand",
            foreignField: "_id",
            as: "brand"
          }
        },

        {
          $unwind: "$brand"
        },

        {
          $group: {
            _id: "$brand._id",

            brandName: {
              $first:
                "$brand.brandName"
            },

            quantitySold: {
              $sum:
                "$items.quantity"
            }
          }
        },

        {
          $sort: {
            quantitySold: -1
          }
        },

        {
          $limit: 5
        }
      ]);


    // -------------------------
    // LOW STOCK PRODUCTS
    // -------------------------

    const lowStockProducts =
      await Product.aggregate([

        {
          $match: {
            isDeleted: {
              $ne: true
            }
          }
        },

        {
          $unwind:
            "$variants"
        },

        {
          $match: {
            "variants.stock": {
              $lte: 5
            }
          }
        },

        {
          $group: {

            _id: "$_id",

            productName: {
              $first:
                "$productName"
            },

            lowestStock: {
              $min:
                "$variants.stock"
            }
          }
        },

        {
          $sort: {
            lowestStock: 1
          }
        },

        {
          $limit: 5
        }
      ]);


    // -------------------------
    // RESPONSE
    // -------------------------

    return res
      .status(STATUS_CODES.OK)
      .json({

        success: true,

        data: {

          totalUsers,

          totalProducts,

          totalOrders,

          totalRevenue,

          recentOrders,

          salesLast7Days,

          topBrands,

          lowStockProducts
        }
      });

  } catch (error) {

    console.log(
      "DASHBOARD STATS ERROR:",
      error
    );

    return res
      .status(
        STATUS_CODES
          .INTERNAL_SERVER_ERROR
      )
      .json({

        success: false,

        message:
          "Unable to load dashboard"
      });
  }
};
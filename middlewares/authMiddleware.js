import User from "../models/userModel.js";
import STATUS_CODES from "../constants/statusCodes.js";

export const requireUser = async (req, res, next) => {
  try {

    
    if (!req.session || !req.session.user) {
      return res.redirect("/login");
    }

    const userId = req.session.user.id;

    
    if (!userId) {
      return res.redirect("/login");
    }

    const user = await User.findById(userId);

    
    if (!user) {
      req.session.user = null;
      return res.redirect("/login");
    }

    
    if (user.isBlocked) {
      req.session.user = null;
      return res.redirect("/login");
    }

  
    req.user = {
      id: user._id
    };

    next();

  } catch (error) {
    console.error("USER AUTH ERROR:", error);

    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Authentication failed"
    });
  }
};

export const requireAdmin = (req, res, next) => {

  if (!req.session.admin) {
      return res.redirect("/admin/login");
  }

  next();
};
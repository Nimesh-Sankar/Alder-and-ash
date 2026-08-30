import express from "express";
import { getUserProfile, updateProfile, changePassword } from "../controllers/userController.js"; 
import {getActiveBanner} from "../controllers/bannerController.js";
import User from "../models/userModel.js";

import STATUS_CODES from "../constants/statusCodes.js";
import { requireUser } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get(
  "/profile/:userId",
  requireUser,
  getUserProfile
);

router.put(
  "/profile/:userId",
  requireUser,
  updateProfile
);

router.post(
  "/change-password",
  requireUser,
  changePassword
);
router.get(
  "/banner",
  getActiveBanner
);

router.get(
  "/check-user/:id",
  requireUser,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user || user.isBlocked) {
        return res.status(STATUS_CODES.UNAUTHORIZED).json({
          success: false,
          message: "User blocked"
        });
      }

      res.json({
        success: true
      });

    } catch {
      res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  }
);

router.get(
  "/products",
  requireUser,
  (req, res) => {
    res.render("user/products");
  }
);
export default router;
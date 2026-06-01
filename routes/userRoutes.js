import express from "express";
import { getUserProfile, updateProfile, changePassword } from "../controllers/userController.js"; 
import User from "../models/userModel.js";
import path from "path";

const router = express.Router();

router.get("/profile/:userId", getUserProfile);
router.put("/profile/:userId", updateProfile);
router.post("/change-password", changePassword);
router.get("/check-user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || user.isBlocked) {
      return res.status(401).json({
        success: false,
        message: "User blocked"
      });
    }

    res.json({
      success: true
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});
router.get(
  "/products",
  (req, res) => {

    res.render("user/products");
  }
);

export default router;
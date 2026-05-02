import express from "express";
import { getUserProfile, updateProfile, changePassword } from "../controllers/userController.js";

const router = express.Router();

router.get("/profile/:userId", getUserProfile);
router.put("/profile/:userId", updateProfile);
router.post("/change-password", changePassword);

export default router;
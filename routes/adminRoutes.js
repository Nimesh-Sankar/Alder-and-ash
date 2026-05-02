import express from "express";
import { toggleBlockUser, getUsersWithFilters, adminLogin } from "../controllers/adminController.js";

const router = express.Router();

router.post("/login", adminLogin);
router.patch("/users/:userId/toggle-block", toggleBlockUser);
router.get("/users", getUsersWithFilters);

export default router;
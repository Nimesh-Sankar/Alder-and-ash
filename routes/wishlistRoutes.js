import express from "express";
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist
} from "../controllers/wishlistController.js";

import { requireUser } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/add",
  requireUser,
  addToWishlist
);

router.post(
  "/remove",
  requireUser,
  removeFromWishlist
);

router.get(
  "/",
  requireUser,
  getWishlist
);

export default router;
import express from "express";
import { requireUser } from "../middlewares/authMiddleware.js";

import {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  removeCoupon
} from "../controllers/cartController.js";

const router = express.Router();

router.post(
  "/add",
  requireUser,
  addToCart
);

router.get(
  "/",
  requireUser,
  getCart
);

router.patch(
  "/items/:itemId",
  requireUser,
  updateCartItem
);

router.delete(
  "/items/:itemId",
  requireUser,
  removeCartItem
);

router.delete(
  "/remove-coupon",
  requireUser,
  removeCoupon
);

export default router;
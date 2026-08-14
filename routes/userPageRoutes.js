import express from "express";
import { requireUser } from "../middlewares/authMiddleware.js";
import { renderWallet } from "../controllers/userController.js";


const router = express.Router();

router.get("/profile", requireUser, function (req, res) {
  res.set("Cache-Control", "no-store");
  res.render("user/profile");
});

router.get("/addresses", requireUser, function (req, res) {
  res.render("user/addresses");
});

router.get("/edit-profile", requireUser, function (req, res) {
  res.render("user/edit-profile");
});

router.get("/change-password", requireUser, function (req, res) {
  res.render("user/change-password");
});

router.get("/cart", requireUser, function (req, res) {
  res.render("user/cart");
});

router.get("/product-details", requireUser, function (req, res) {
  res.render("user/product-details");
});

router.get("/wishlist", requireUser, function (req, res) {
  res.render("user/wishlist");
});

router.get("/checkout", requireUser, function (req, res) {
  res.render("user/checkout");
});
router.get("/checkout", requireUser, function (req, res) {
  res.render("user/checkout");
});

router.get("/wallet", requireUser, renderWallet);

export default router;
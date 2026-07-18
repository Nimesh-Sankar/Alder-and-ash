import express from "express";

const router = express.Router();

router.get("/profile", function (req, res) {
  res.set("Cache-Control", "no-store");
  res.render("user/profile");
});

router.get("/addresses", function (req, res) {
  res.render("user/addresses");
});

router.get("/edit-profile", function (req, res) {
  res.render("user/edit-profile");
});

router.get("/change-password", function (req, res) {
  res.render("user/change-password");
});

router.get("/cart", function (req, res) {
  res.render("user/cart");
});

router.get("/product-details", function (req, res) {
  res.render("user/product-details");
});

router.get("/wishlist", function (req, res) {
  res.render("user/wishlist");
});
router.get("/checkout", function (req, res) {
  res.render("user/checkout");
});

export default router;
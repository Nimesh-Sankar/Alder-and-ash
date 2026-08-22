import { requireAdmin } from "../middlewares/authMiddleware.js";
import express from "express";
import {
  toggleBlockUser,
  getUsersWithFilters,
  adminLogin,
  getDashboardStats
} from "../controllers/adminController.js";

import {
  addCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus
} from "../controllers/categoryController.js";

import {
  addBrand,
  getBrands,
  updateBrand,
  toggleBrandStatus,
  deleteBrand
} from "../controllers/brandController.js";

import {
  addProduct,
  getProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus
} from "../controllers/productController.js";

import {
  createCoupon,
  getCoupons,
  deleteCoupon,
  updateCoupon
} from "../controllers/couponController.js";

import {
  createOffer,
  getOffers,
  deleteOffer,
  toggleOfferStatus
} from "../controllers/offerController.js";

import {
  createBanner,
  getBanners,
  updateBanner,
  toggleBannerStatus,
  deleteBanner
} from "../controllers/bannerController.js";

import upload from "../config/multer.js";

const router = express.Router();

function noCache(req, res, next) {
  res.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private"
  );

  res.set(
    "Pragma",
    "no-cache"
  );

  res.set(
    "Expires",
    "0"
  );

  next();
}

router.post("/login", adminLogin);

router.get("/login", (req, res) => {
  res.render("admin/login");
});

// USER MANAGEMENT
router.patch(
  "/users/:userId/toggle-block",
  requireAdmin,
  toggleBlockUser
);

router.get(
  "/dashboard-stats",
  requireAdmin,
  getDashboardStats
);

router.get(
  "/users",
  requireAdmin,
  getUsersWithFilters
);

// CATEGORY
router.post(
  "/categories",
  requireAdmin,
  addCategory
);

router.get(
  "/categories",
  getCategories
);

router.patch(
  "/categories/:id",
  requireAdmin,
  updateCategory
);

router.patch(
  "/categories/delete/:id",
  requireAdmin,
  deleteCategory
);

router.patch(
  "/categories/:categoryId/status",
  requireAdmin,
  toggleCategoryStatus
);

// BRAND
router.post(
  "/brands",
  requireAdmin,
  addBrand
);

router.get(
  "/brands",
  getBrands
);

router.patch(
  "/brands/:id",
  requireAdmin,
  updateBrand
);

router.patch(
  "/brands/delete/:id",
  requireAdmin,
  deleteBrand
);

router.patch(
  "/brands/:brandId/status",
  requireAdmin,
  toggleBrandStatus
);

// PRODUCT
router.post(
  "/products",
  requireAdmin,
  upload.array("images", 5),
  addProduct
);

router.get(
  "/products",
  getProducts
);

router.get(
  "/products/:id",
  getSingleProduct
);

router.patch(
  "/products/:id",
  requireAdmin,
  upload.array("images", 5),
  updateProduct
);

router.patch(
  "/products/delete/:id",
  requireAdmin,
  deleteProduct
);


router.patch(
  "/products/:productId/status",
  requireAdmin,
  toggleProductStatus
);
// COUPON

router.post(
  "/coupons",
  requireAdmin,
  createCoupon
);

router.get(
  "/coupons",
  requireAdmin,
  getCoupons
);

router.delete(
  "/coupons/:id",
  requireAdmin,
  deleteCoupon
);

router.patch(
  "/coupons/:id",
  requireAdmin,
  updateCoupon
);


router.get(
  "/",
  requireAdmin,
  noCache,
  (req, res) => {
    res.render("admin/dashboard");
  }
);

router.get(
  "/category",
  requireAdmin,
  noCache,
  (req, res) => {
    res.render("admin/category");
  }
);

router.get(
  "/add-category",
  requireAdmin,
  noCache,
  (req, res) => {
    res.render("admin/add-category");
  }
);

router.get(
  "/edit-category",
  requireAdmin,
  noCache,
  (req, res) => {
    res.render("admin/edit-category");
  }
);

router.get(
  "/brands-page",
  requireAdmin,
  noCache,
  (req, res) => {
    res.render("admin/brands");
  }
);

router.get(
  "/add-brand",
  requireAdmin,
  noCache,
  (req, res) => {
    res.render("admin/add-brand");
  }
);

router.get(
  "/edit-brand",
  requireAdmin,
  noCache,
  (req, res) => {
    res.render("admin/edit-brand");
  }
);

router.get(
  "/products-page",
  requireAdmin,
  noCache,
  (req, res) => {
    res.render("admin/products");
  }
);

router.get(
  "/add-product",
  requireAdmin,
  noCache,
  (req, res) => {
    res.render("admin/add-product");
  }
);

router.get(
  "/edit-product",
  requireAdmin,
  noCache,
  (req, res) => {
    res.render("admin/edit-product");
  }
);
router.get(
  "/coupons-page",
  requireAdmin,
  noCache,
  (req, res) => {
      res.render("admin/coupons");
  }
);
// OFFER

router.post(
  "/offers",
  requireAdmin,
  createOffer
);

router.get(
  "/offers",
  requireAdmin,
  getOffers
);

router.delete(
  "/offers/:id",
  requireAdmin,
  deleteOffer
);

router.patch(
  "/offers/:id/status",
  requireAdmin,
  toggleOfferStatus
);
// BANNER

router.post(
  "/banners",
  requireAdmin,
  upload.single("image"),
  createBanner
);

router.get(
  "/banners",
  requireAdmin,
  getBanners
);

router.patch(
  "/banners/:id/status",
  requireAdmin,
  toggleBannerStatus
);

router.delete(
  "/banners/:id",
  requireAdmin,
  deleteBanner
);
router.patch(
  "/banners/:id",
  requireAdmin,
  upload.single("image"),
  updateBanner
);

router.get(
  "/offers-page",
  requireAdmin,
  noCache,
  (req, res) => {
    res.render("admin/offers");
  }
);
router.get(
  "/banners-page",
  requireAdmin,
  (req, res) => {
      res.render("admin/banners");
  }
);

export default router;
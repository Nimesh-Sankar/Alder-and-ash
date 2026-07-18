import express from "express";
import {
  toggleBlockUser,
  getUsersWithFilters,
  adminLogin
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

router.patch(
  "/users/:userId/toggle-block",
  toggleBlockUser
);

router.get(
  "/users",
  getUsersWithFilters
);

router.post(
  "/categories",
  addCategory
);

router.get(
  "/categories",
  getCategories
);

router.patch(
  "/categories/:id",
  updateCategory
);

router.patch(
  "/categories/delete/:id",
  deleteCategory
);
router.patch(
  "/categories/:categoryId/status",
  toggleCategoryStatus
);

router.post(
  "/brands",
  addBrand
);

router.get(
  "/brands",
  getBrands
);

router.patch(
  "/brands/:id",
  updateBrand
);

router.patch(
  "/brands/delete/:id",
  deleteBrand
);

router.patch(
  "/brands/:brandId/status",
  toggleBrandStatus
);

router.post(
  "/products",
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
  upload.array("images", 5),
  updateProduct
);

router.patch(
  "/products/delete/:id",
  deleteProduct
);

router.patch(
  "/products/:productId/status",
  toggleProductStatus
);

// ADMIN PAGE ROUTES

router.get(
  "/login",
  (req, res) => {
    res.render("admin/login");
  }
);

router.get(
  "/",
  noCache,
  (req, res) => {
    res.render("admin/dashboard");
  }
);

router.get(
  "/category",
  noCache,
  (req, res) => {
    res.render("admin/category");
  }
);

router.get(
  "/add-category",
  noCache,
  (req, res) => {
    res.render("admin/add-category");
  }
);

router.get(
  "/edit-category",
  noCache,
  (req, res) => {
    res.render("admin/edit-category");
  }
);

router.get(
  "/brands-page",
  noCache,
  (req, res) => {
    res.render("admin/brands");
  }
);

router.get(
  "/add-brand",
  noCache,
  (req, res) => {
    res.render("admin/add-brand");
  }
);

router.get(
  "/edit-brand",
  noCache,
  (req, res) => {
    res.render("admin/edit-brand");
  }
);

router.get(
  "/products-page",
  noCache,
  (req, res) => {
    res.render("admin/products");
  }
);

router.get(
  "/add-product",
  noCache,
  (req, res) => {
    res.render("admin/add-product");
  }
);

router.get(
  "/edit-product",
  noCache,
  (req, res) => {
    res.render("admin/edit-product");
  }
);

export default router;
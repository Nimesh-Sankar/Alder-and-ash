import express from "express";
import { toggleBlockUser, getUsersWithFilters, adminLogin } from "../controllers/adminController.js";
import {addCategory,getCategories,updateCategory,deleteCategory} from "../controllers/categoryController.js";
import {addBrand,getBrands,updateBrand,toggleBrandStatus,deleteBrand} from "../controllers/brandController.js";
import {addProduct,getProducts,getSingleProduct,updateProduct,deleteProduct,toggleProductStatus} from "../controllers/productController.js";
import upload from "../config/multer.js";
const router = express.Router();

router.post("/login", adminLogin);
router.patch("/users/:userId/toggle-block", toggleBlockUser);
router.get("/users", getUsersWithFilters);
router.post("/categories", addCategory);
router.get("/categories", getCategories);
router.patch("/categories/:id", updateCategory);
router.patch("/categories/delete/:id", deleteCategory);
router.post("/brands", addBrand);


router.get("/brands", getBrands);

router.patch("/brands/:id", updateBrand);
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


export default router;
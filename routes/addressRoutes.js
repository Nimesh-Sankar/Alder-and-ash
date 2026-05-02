import express from "express";
import {
  addAddress,
  updateAddress,
  deleteAddress,
} from "../controllers/addressController.js";

const router = express.Router();

router.post("/", addAddress);
router.put("/:addressId", updateAddress);
router.delete("/:addressId", deleteAddress);

export default router;
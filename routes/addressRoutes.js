import express from "express";
import {addAddress,updateAddress,deleteAddress,getUserAddresses} from "../controllers/addressController.js";

const router = express.Router();

router.get("/:userId", getUserAddresses);
router.post("/", addAddress);
router.put("/:addressId", updateAddress);
router.delete("/:addressId", deleteAddress);

export default router;
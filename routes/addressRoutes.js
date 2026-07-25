import express from "express";
import { requireUser } from "../middlewares/authMiddleware.js";

import {
    addAddress,
    updateAddress,
    deleteAddress,
    getUserAddresses
} from "../controllers/addressController.js";

const router = express.Router();

router.get(
    "/:userId",
    requireUser,
    getUserAddresses
);

router.post(
    "/",
    requireUser,
    addAddress
);

router.put(
    "/:addressId",
    requireUser,
    updateAddress
);

router.delete(
    "/:addressId",
    requireUser,
    deleteAddress
);

export default router;
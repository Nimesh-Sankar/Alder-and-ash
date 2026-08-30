import express from "express";
import {
  getWallet
} from "../controllers/walletController.js";

import { requireUser } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get(
  "/",
  requireUser,
  getWallet
);

export default router;
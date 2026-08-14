import express from "express";
import {
    getWallet
} from "../controllers/walletController.js";

const router = express.Router();

router.get("/", getWallet);

export default router;
import express from "express";
import { requireAdmin } from "../middlewares/authMiddleware.js";

import {
    getSalesReport,
    downloadSalesReportPDF,
    downloadSalesReportExcel
} from "../controllers/reportController.js";

const router = express.Router();

router.get(
    "/",
    requireAdmin,
    (req, res) => {
        res.render("admin/reports");
    }
);

router.get(
    "/data",
    requireAdmin,
    getSalesReport
);

router.get(
    "/download/pdf",
    requireAdmin,
    downloadSalesReportPDF
);

router.get(
    "/download/excel",
    requireAdmin,
    downloadSalesReportExcel
);

export default router;
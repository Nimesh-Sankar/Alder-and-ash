import express from "express";
import { placeOrder,createRazorpayOrder,verifyRazorpayPayment,getMyOrders,getOrderDetails,renderOrderSuccess,renderPaymentFailed,renderMyOrders,renderOrderDetails,
renderCancelPage,cancelOrder,
renderReturnPage,returnOrder,renderAdminOrders,updateOrderStatus,downloadInvoice,renderAdminOrderDetails} from "../controllers/orderController.js";
import {
    requireUser,
    requireAdmin
} from "../middlewares/authMiddleware.js";
import { applyCoupon } from "../controllers/couponController.js";

const router = express.Router();

router.post("/", requireUser, placeOrder);

router.post("/create-payment",requireUser,createRazorpayOrder);
router.post(
    "/verify-payment",
    requireUser,
    verifyRazorpayPayment
);

router.get("/my-orders", requireUser, renderMyOrders);

router.get("/success/:orderId", requireUser, renderOrderSuccess);
router.get(
    "/order-failed",
    requireUser,
    renderPaymentFailed
);

router.get("/details/:orderId", requireUser, renderOrderDetails);

router.get("/cancel/:orderId", requireUser, renderCancelPage);

router.post("/cancel/:orderId", requireUser, cancelOrder);

router.get("/return/:orderId", requireUser, renderReturnPage);

router.post("/return/:orderId", requireUser, returnOrder);

router.get("/invoice/:orderId", requireUser, downloadInvoice);

router.get("/", requireUser, getMyOrders);

// Admin Routes
router.get(
    "/admin/details/:orderId",
    requireAdmin,
    renderAdminOrderDetails
);

router.get(
    "/admin/orders",
    requireAdmin,
    renderAdminOrders
);

router.post(
    "/admin/update-status/:orderId",
    requireAdmin,
    updateOrderStatus
);


router.get(
    "/:orderId",
    requireUser,
    getOrderDetails
);
router.post(
    "/apply-coupon",
    requireUser,
    applyCoupon
);
export default router;
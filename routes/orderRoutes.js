import express from "express";
import { placeOrder,createRazorpayOrder,verifyRazorpayPayment,handlePaymentFailed,retryPayment,verifyRetryPayment,getMyOrders,getOrderDetails,renderOrderSuccess,renderPaymentFailed,renderMyOrders,renderOrderDetails,
renderCancelPage,cancelOrder,
renderReturnPage,
returnOrder,
renderAdminOrders,
updateOrderStatus,
approveReturn,
downloadInvoice,
renderAdminOrderDetails} from "../controllers/orderController.js";
import {
    requireUser,
    requireAdmin
} from "../middlewares/authMiddleware.js";
import {
    applyCoupon,
    getAvailableCoupons
} from "../controllers/couponController.js";
const router = express.Router();

router.post("/", requireUser, placeOrder);

router.post("/create-payment",requireUser,createRazorpayOrder);
router.post(
    "/verify-payment",
    requireUser,
    verifyRazorpayPayment
);
router.post(
    "/payment-failed",
    requireUser,
    handlePaymentFailed
);
router.get(
    "/retry-payment/:orderId",
    requireUser,
    retryPayment
);
router.post(
    "/retry-payment/verify/:orderId",
    requireUser,
    verifyRetryPayment
);

router.get("/my-orders", requireUser, renderMyOrders);

router.get("/success/:orderId", requireUser, renderOrderSuccess);
router.get(
    "/order-failed/:orderId",
    requireUser,
    renderPaymentFailed
);

router.get("/details/:orderId", requireUser, renderOrderDetails);
router.get(
    "/cancel/:orderId/:itemId",
    requireUser,
    renderCancelPage
);

router.post(
    "/cancel/:orderId/:itemId",
    requireUser,
    cancelOrder
);

router.get(
    "/return/:orderId/:itemId",
    requireUser,
    renderReturnPage
);

router.post(
    "/return/:orderId/:itemId",
    requireUser,
    returnOrder
);

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
router.post(
    "/admin/approve-return/:orderId",
    requireAdmin,
    approveReturn
);

router.get(
    "/available-coupons",
    requireUser,
    getAvailableCoupons
);

router.post(
    "/apply-coupon",
    requireUser,
    applyCoupon
);

router.get(
    "/:orderId",
    requireUser,
    getOrderDetails
);
export default router;
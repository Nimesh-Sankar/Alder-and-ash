import express from "express";
import { placeOrder,getMyOrders,getOrderDetails,renderOrderSuccess,renderMyOrders,renderOrderDetails,
renderCancelPage,cancelOrder,
renderReturnPage,returnOrder,renderAdminOrders,updateOrderStatus,downloadInvoice} from "../controllers/orderController.js";

const router = express.Router();

router.post("/", placeOrder);
router.get("/my-orders", renderMyOrders);
router.get("/success/:orderId", renderOrderSuccess);
router.get("/", getMyOrders);



router.get("/details/:orderId", renderOrderDetails);
router.get("/:orderId", getOrderDetails);
router.get("/cancel/:orderId",renderCancelPage);

router.post("/cancel/:orderId",cancelOrder);

router.get("/return/:orderId",renderReturnPage);

router.post("/return/:orderId",returnOrder);
router.get(
  "/admin/orders",
  renderAdminOrders
);
router.post(
  "/admin/update-status/:orderId",
  updateOrderStatus
);
router.get(
  "/invoice/:orderId",
  downloadInvoice
);
export default router;

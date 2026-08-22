import Order from "../models/orderModel.js";
import Cart from "../models/cartModel.js";
import Address from "../models/addressModel.js";
import Product from "../models/productModel.js";
import Category from "../models/categoryModel.js";
import Brand from "../models/brandModel.js";
import PDFDocument from "pdfkit";
import razorpay from "../config/razorpay.js";
import crypto from "crypto";
import Wallet from "../models/walletModel.js";

export const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { addressId, paymentMethod } = req.body;

        const address = await Address.findById(addressId);

        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        const cart = await Cart.findOne({ user: userId })
        .populate("items.product")
        .populate("coupon");

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            });
        }

    
        for (const item of cart.items) {

            const product = item.product;
            const category =
    await Category.findById(
        product.category
    );

if (!category || !category.isListed) {

    return res.status(400).json({
        success: false,
        message:
            `${product.productName} category is unavailable`
    });

}

const brand =
    await Brand.findById(
        product.brand
    );

if (!brand || brand.isBlocked) {

    return res.status(400).json({
        success: false,
        message:
            `${product.productName} brand is unavailable`
    });

}
        
            if (product.isBlocked) {
        
                return res.status(400).json({
                    success: false,
                    message:
                        `${product.productName} NO LONGER AVAILABLE`
                });
        
            }
        
            if (!product.isListed) {
        
                return res.status(400).json({
                    success: false,
                    message:
                        `${product.productName} is currently unavailable`
                });
        
            }
        
            const variant = product.variants.find(
                variant =>
                    variant.size === item.size &&
                    variant.color === item.color
            );
        
            if (!variant || variant.stock < item.quantity) {
        
                return res.status(400).json({
                    success: false,
                    message:
                        `${product.productName} is out of stock`
                });
        
            }
        }
        let wallet = null;

if (paymentMethod === "WALLET") {

    wallet = await Wallet.findOne({
        user: userId
    });

    if (!wallet) {
        return res.status(400).json({
            success: false,
            message: "Wallet not found"
        });
    }

    if (wallet.balance < cart.grandTotal) {
        return res.status(400).json({
            success: false,
            message: "Insufficient wallet balance"
        });
    }
}
        
        const orderCount = await Order.countDocuments();
        const orderId = `ORD${1000 + orderCount + 1}`;

        
        const order = await Order.create({
            orderId,
            user: userId,
        
            items: cart.items.map(item => ({
                product: item.product._id,
                size: item.size,
                color: item.color,
                quantity: item.quantity,
                price: item.price
            })),
        
            address: addressId,
    
                        couponCode: cart.coupon
                ? cart.coupon.code
                : null,

            couponDiscount: cart.couponDiscount || 0,

            paymentMethod,

            paymentStatus:
                paymentMethod === "WALLET"
                    ? "PAID"
                    : "PENDING",
            
            subtotal: cart.subTotal,
            tax: cart.tax,
            shipping: cart.shipping,
            grandTotal: cart.grandTotal,
        
            status: "PLACED"
        });
        if (paymentMethod === "WALLET") {

            wallet.balance -= cart.grandTotal;
        
            wallet.transactions.push({
                type: "DEBIT",
                amount: cart.grandTotal,
                balanceAfter: wallet.balance,
                description: `Payment for order ${order.orderId}`,
                orderId: order.orderId
            });
        
            await wallet.save();
        }

        
        for (const item of cart.items) {
            const product = await Product.findById(item.product._id);

            const variant = product.variants.find(
                variant =>
                    variant.size === item.size &&
                    variant.color === item.color
            );

            variant.stock -= item.quantity;
            await product.save();
        }

        
        cart.items = [];

        cart.coupon = null;
        cart.couponDiscount = 0;
        
        cart.subTotal = 0;
        cart.tax = 0;
        cart.shipping = 0;
        cart.grandTotal = 0;
        
        await cart.save();

        
        res.status(200).json({
            success: true,
            data: {
                orderId: order.orderId,
                status: order.status
            }
        });

    } catch (error) {
        console.log("PLACE ORDER ERROR:", error.message);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};
export const createRazorpayOrder = async (req, res) => {

    try {

        const userId = req.session.user.id;
        const { addressId } = req.body;

        const address = await Address.findById(addressId);

        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        const cart = await Cart.findOne({
            user: userId
        })
        .populate("items.product")
        .populate("coupon");

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            });
        }

        // Check products and stock
        for (const item of cart.items) {

            const product = item.product;

            const category =
                await Category.findById(
                    product.category
                );

            if (!category || !category.isListed) {
                return res.status(400).json({
                    success: false,
                    message:
                        `${product.productName} category is unavailable`
                });
            }

            const brand =
                await Brand.findById(
                    product.brand
                );

            if (!brand || brand.isBlocked) {
                return res.status(400).json({
                    success: false,
                    message:
                        `${product.productName} brand is unavailable`
                });
            }

            if (product.isBlocked) {
                return res.status(400).json({
                    success: false,
                    message:
                        `${product.productName} is unavailable`
                });
            }

            if (!product.isListed) {
                return res.status(400).json({
                    success: false,
                    message:
                        `${product.productName} is currently unavailable`
                });
            }

            const variant =
                product.variants.find(
                    variant =>
                        variant.size === item.size &&
                        variant.color === item.color
                );

            if (
                !variant ||
                variant.stock < item.quantity
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `${product.productName} is out of stock`
                });
            }
        }

        // Razorpay amount must be in paise
        const amount =
            Math.round(cart.grandTotal * 100);

        const options = {
            amount: amount,
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        };

        const razorpayOrder =
            await razorpay.orders.create(options);

        res.status(200).json({
            success: true,
            data: {
                razorpayOrderId:
                    razorpayOrder.id,

                amount:
                    razorpayOrder.amount,

                currency:
                    razorpayOrder.currency
            }
        });

    } catch (error) {

        console.log(
            "CREATE RAZORPAY ORDER ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to create payment order"
        });

    }

};
export const verifyRazorpayPayment = async (req, res) => {
    try {

        const userId = req.session.user.id;

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            addressId
        } = req.body;

        const body =
            razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature =
            crypto
                .createHmac(
                    "sha256",
                    process.env.RAZORPAY_KEY_SECRET
                )
                .update(body)
                .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed"
            });
        }

        const address = await Address.findById(addressId);

        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        const cart = await Cart.findOne({
            user: userId
        })
        .populate("items.product")
        .populate("coupon");

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            });
        }

        const orderCount =
            await Order.countDocuments();

        const orderId =
            `ORD${1000 + orderCount + 1}`;

        const order = await Order.create({

            orderId,

            user: userId,

            items: cart.items.map(item => ({
                product: item.product._id,
                size: item.size,
                color: item.color,
                quantity: item.quantity,
                price: item.price
            })),

            address: addressId,

            couponCode:
                cart.coupon
                    ? cart.coupon.code
                    : null,

            couponDiscount:
                cart.couponDiscount || 0,

            paymentMethod: "RAZORPAY",

            paymentStatus: "PAID",

            transactionId:
                razorpay_payment_id,

            subtotal: cart.subTotal,

            tax: cart.tax,

            shipping: cart.shipping,

            grandTotal: cart.grandTotal,

            status: "PLACED"
        });

        for (const item of cart.items) {

            const product =
                await Product.findById(
                    item.product._id
                );

            const variant =
                product.variants.find(
                    variant =>
                        variant.size === item.size &&
                        variant.color === item.color
                );

            if (variant) {
                variant.stock -= item.quantity;
            }

            await product.save();
        }

            cart.items = [];

        cart.coupon = null;
        cart.couponDiscount = 0;

        cart.subTotal = 0;
        cart.tax = 0;
        cart.shipping = 0;
        cart.grandTotal = 0;

        
        await cart.save();

        res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            data: {
                orderId: order.orderId,
                paymentId: razorpay_payment_id
            }
        });

    } catch (error) {

        console.log(
            "VERIFY RAZORPAY PAYMENT ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Payment verification failed"
        });
    }
};
export const handlePaymentFailed = async (req, res) => {
    try {

        const userId = req.session.user.id;

        const {
            razorpayOrderId,
            error
        } = req.body;

        const cart = await Cart.findOne({
            user: userId
        })
        .populate("items.product")
        .populate("coupon");

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            });
        }

        const orderCount = await Order.countDocuments();

        const orderId =
            `ORD${1000 + orderCount + 1}`;

        const order = await Order.create({

            orderId,

            user: userId,

            items: cart.items.map(item => ({
                product: item.product._id,
                size: item.size,
                color: item.color,
                quantity: item.quantity,
                price: item.price,
                status: "ORDER_FAILED"
            })),

            address: req.body.addressId,

            couponCode: cart.coupon
                ? cart.coupon.code
                : null,

            couponDiscount: cart.couponDiscount || 0,

            paymentMethod: "RAZORPAY",

            paymentStatus: "FAILED",

            transactionId: null,

            subtotal: cart.subTotal,

            tax: cart.tax,

            shipping: cart.shipping,

            grandTotal: cart.grandTotal,

            status: "ORDER_FAILED"
        });

        res.status(200).json({
            success: true,
            message: "Payment failure recorded",
            data: {
                orderId: order.orderId
            }
        });

    } catch (error) {

        console.log(
            "HANDLE PAYMENT FAILED ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Unable to record failed payment"
        });
    }
};
export const retryPayment = async (req, res) => {
    try {

        const userId = req.session.user.id;
        const { orderId } = req.params;

        const order = await Order.findOne({
            orderId,
            user: userId
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (
            order.status !== "ORDER_FAILED" ||
            order.paymentStatus !== "FAILED"
        ) {
            return res.status(400).json({
                success: false,
                message: "This order cannot be retried"
            });
        }

        const amount =
            Math.round(order.grandTotal * 100);

        const razorpayOrder =
            await razorpay.orders.create({
                amount,
                currency: "INR",
                receipt: `retry_${order.orderId}_${Date.now()}`
            });

        res.status(200).json({
            success: true,
            data: {
                orderId: order.orderId,
                razorpayOrderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency
            }
        });

    } catch (error) {

        console.log(
            "RETRY PAYMENT ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Unable to retry payment"
        });
    }
};
export const verifyRetryPayment = async (req, res) => {
    try {

        const userId = req.session.user.id;
        const { orderId } = req.params;

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        const body =
            razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature =
            crypto
                .createHmac(
                    "sha256",
                    process.env.RAZORPAY_KEY_SECRET
                )
                .update(body)
                .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed"
            });
        }

        const order = await Order.findOne({
            orderId,
            user: userId,
            status: "ORDER_FAILED",
            paymentStatus: "FAILED"
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Failed order not found"
            });
        }

        // Check stock before completing retry
        for (const item of order.items) {

            const product = await Product.findById(
                item.product
            );

            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: "Product not available"
                });
            }

            const variant = product.variants.find(
                variant =>
                    variant.size === item.size &&
                    variant.color === item.color
            );

            if (
                !variant ||
                variant.stock < item.quantity
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `${product.productName} is out of stock`
                });
            }
        }

        // Reduce stock
        for (const item of order.items) {

            const product = await Product.findById(
                item.product
            );

            const variant = product.variants.find(
                variant =>
                    variant.size === item.size &&
                    variant.color === item.color
            );

            variant.stock -= item.quantity;

            await product.save();

            item.status = "PLACED";
        }

        // Update failed order
        order.status = "PLACED";
        order.paymentStatus = "PAID";
        order.transactionId =
            razorpay_payment_id;

        await order.save();

        // =========================
        // CLEAR CART AFTER RETRY SUCCESS
        // =========================

        const cart = await Cart.findOne({
            user: userId
        });

        if (cart) {

            cart.items = [];

            cart.coupon = null;
            cart.couponDiscount = 0;

            cart.subTotal = 0;
            cart.tax = 0;
            cart.shipping = 0;
            cart.grandTotal = 0;

            await cart.save();
        }

        res.status(200).json({
            success: true,
            message: "Retry payment successful",
            data: {
                orderId: order.orderId
            }
        });

    } catch (error) {

        console.log(
            "VERIFY RETRY PAYMENT ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Unable to verify retry payment"
        });
    }
};
export const renderPaymentFailed = async (req, res) => {
    try {

        const { orderId } = req.params;

        res.render("user/order-failed", {
            orderId
        });

    } catch (error) {

        console.log(error);

        res.status(500).send(
            "Server Error"
        );
    }
};
export const getMyOrders = async (req, res) => {
  try{
    const userId = req.session.user.id;

    const orders = await Order.find({ user: userId })
    .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: orders
    });
  }catch(error){
    console.error(error);
    res.status(500).json({message: "Internal server error"});
  }
}
export const getOrderDetails = async (req, res) => {

  try {

      const { orderId } =
          req.params;

      const order =
          await Order.findOne({
              orderId
          })
          .populate("items.product")
          .populate("address");

      if (!order) {

          return res.status(404).json({
              success: false,
              message: "Order not found"
          });

      }

      res.status(200).json({
          success: true,
          order
      });

  } catch (error) {

      console.log(
          "GET ORDER DETAILS ERROR:",
          error.message
      );

      res.status(500).json({
          success: false,
          message: "Server Error"
      });

  }

};
export const renderOrderSuccess=
async(req,res)=>{
  try{
    const {orderId}=req.params;
   const order=await Order.findOne({orderId}).populate("address").populate("items.product");
    if(!order){
      return res.status(404).send("Order not found");
    }
    res.render("user/order-success",{order});
  }catch(error){
    console.error(error);
    res.status(500).send("Internal server error");
  }
}
export const renderMyOrders = async (req, res) => {
    try {

        if (!req.session.user) {
            return res.redirect("/login");
        }

        const userId = req.session.user.id;

        const page=parseInt(req.query.page) || 1;
        const limit=7;
        const skip=(page-1)*limit;
        const orders = await Order.find({ user: userId })
        .populate("address")
        .populate("items.product")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
        const totalOrders = await Order.countDocuments({
            user: userId
        });
        
        const totalPages = Math.ceil(totalOrders / limit);
            

        res.render("user/my-orders", {
            orders,
            currentPage: page,
            totalPages
        });

    } catch (error) {
        console.log(error);
        res.status(500).send("Server Error");
    }
};


export const renderOrderDetails = async(req,res)=>{
    console.log("ORDER DETAILS USER:", req.session.user);

    const order = await Order.findOne({
        orderId:req.params.orderId
    })
    .populate("items.product")
    .populate("address");

    if(!order){
        return res.status(404).send("Order not found");
    }

    res.render(
        "user/order-details",
        { order }
    );
}
export const renderCancelPage = async (req, res) => {
    console.log("CANCEL PAGE HIT");
    try {

        if (!req.session.user) {
            return res.redirect("/login");
        }

        const order = await Order.findOne({
            orderId: req.params.orderId,
            user: req.session.user.id
        }).populate("items.product");

        if (!order) {
            return res.status(404).send("Order not found");
        }
        const item = order.items.id(req.params.itemId);

if (!item) {
    return res.status(404).send(
        "Order item not found"
    );
}

res.render("user/cancel-order", {
    order,
    item
});

    } catch (error) {
        console.log(error);
        res.status(500).send("Server Error");
    }
};
export const renderReturnPage = async (req, res) => {

    try {

        if (!req.session.user) {
            return res.redirect("/login");
        }

        const order = await Order.findOne({
            orderId: req.params.orderId,
            user: req.session.user.id
        }).populate("items.product");

        if (!order) {
            return res.status(404).send(
                "Order not found"
            );
        }

        const item = order.items.id(
            req.params.itemId
        );

        if (!item) {
            return res.status(404).send(
                "Order item not found"
            );
        }

        res.render("user/return-order", {
            order,
            item
        });

    } catch (error) {

        console.log(error);

        res.status(500).send(
            "Server Error"
        );
    }
};
export const cancelOrder = async (req, res) => {
    try {

        const order = await Order.findOne({
            orderId: req.params.orderId,
            user: req.session.user.id
        });

        if (!order) {
            return res.status(404).send(
                "Order not found"
            );
        }

        if (
            order.status === "DELIVERED" ||
            order.status === "CANCELLED"
        ) {
            return res.send(
                "This order cannot be cancelled."
            );
        }

        const item = order.items.id(
            req.params.itemId
        );

        if (!item) {
            return res.status(404).send(
                "Order item not found"
            );
        }

        if (item.status === "CANCELLED") {
            return res.send(
                "This item is already cancelled."
            );
        }

        item.status = "CANCELLED";

        order.cancellationReason =
            req.body.reason || null;

        // Restore stock for ONLY this item
        const product = await Product.findById(
            item.product
        );

        if (product) {

            const variant = product.variants.find(
                v =>
                    v.size === item.size &&
                    v.color === item.color
            );

            if (variant) {
                variant.stock += item.quantity;
            }

            await product.save();
        }

        // Amount for only this cancelled item
        const refundAmount =
            item.price * item.quantity;

        // Refund only paid online/wallet orders
        if (
            (
                order.paymentMethod === "RAZORPAY" ||
                order.paymentMethod === "WALLET"
            ) &&
            order.paymentStatus === "PAID"
        ) {

            let wallet = await Wallet.findOne({
                user: req.session.user.id
            });

            if (!wallet) {

                wallet = await Wallet.create({
                    user: req.session.user.id,
                    walletId: `WALLET-${Date.now()}`,
                    balance: 0,
                    transactions: []
                });

            }

            wallet.balance += refundAmount;

            wallet.transactions.push({
                type: "CREDIT",
                amount: refundAmount,
                balanceAfter: wallet.balance,
                description:
                    `Refund for cancelled item in order ${order.orderId}`,
                orderId: order.orderId
            });

            await wallet.save();
        }

        // Check whether EVERY item is cancelled
        const allCancelled =
            order.items.every(
                item =>
                    item.status === "CANCELLED"
            );

        if (allCancelled) {
            order.status = "CANCELLED";
        }

        await order.save();

        res.redirect(
            `/api/orders/details/${order.orderId}`
        );

    } catch (error) {

        console.log(
            "CANCEL ITEM ERROR:",
            error
        );

        res.status(500).send(
            "Server Error"
        );
    }
};
export const returnOrder = async (req, res) => {
    try {

        const order = await Order.findOne({
            orderId: req.params.orderId,
            user: req.session.user.id
        });

        if (!order) {
            return res.status(404).send(
                "Order not found"
            );
        }

        if (order.status !== "DELIVERED") {
            return res.send(
                "Only delivered orders can be returned."
            );
        }

        const item = order.items.id(
            req.params.itemId
        );

        if (!item) {
            return res.status(404).send(
                "Order item not found"
            );
        }

        if (
            item.status === "RETURN_REQUESTED" ||
            item.status === "RETURNED"
        ) {
            return res.status(400).send(
                "This item has already been returned or requested for return."
            );
        }

        const deliveredDate =
            new Date(order.updatedAt);

        const returnDeadline =
            new Date(deliveredDate);

        returnDeadline.setDate(
            returnDeadline.getDate() + 7
        );

        if (new Date() > returnDeadline) {
            return res.status(400).send(
                "Return period has expired."
            );
        }

        if (!req.body.reason) {
            return res.status(400).send(
                "Return reason is required."
            );
        }

        // Only this item
        item.status = "RETURN_REQUESTED";

        order.returnReason =
            req.body.reason;

        // If every non-cancelled item is return requested,
        // then update the overall order status
        const activeItems = order.items.filter(
            orderItem =>
                orderItem.status !== "CANCELLED"
        );

        const allReturnRequested =
            activeItems.length > 0 &&
            activeItems.every(
                orderItem =>
                    orderItem.status === "RETURN_REQUESTED" ||
                    orderItem.status === "RETURNED"
            );

        if (allReturnRequested) {
            order.status = "RETURN_REQUESTED";
        }

        await order.save();

        res.redirect(
            `/api/orders/details/${order.orderId}`
        );

    } catch (error) {

        console.log(
            "RETURN ITEM ERROR:",
            error
        );

        res.status(500).send(
            "Server Error"
        );
    }
};

export const downloadInvoice = async (req, res) => {
    try {
        console.log("DOWNLOAD USER:", req.session.user);
        console.log("SESSION:", req.session);
console.log("USER:", req.session.user);

        if (!req.session.user) {
            return res.redirect("/login");
        }

        const order = await Order.findOne({
            orderId: req.params.orderId,
            user: req.session.user.id
        })
        .populate("user")
        .populate("address")
        .populate("items.product");

        if (!order) {
            return res.status(404).send("Order not found");
        }

        const doc = new PDFDocument({
            margin: 50
        });

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${order.orderId}.pdf`
        );

        doc.pipe(res);

        // ======================
        // STORE HEADER
        // ======================

        doc.fontSize(24)
           .text("Alder & Ash", {
               align: "center"
           });

        doc.fontSize(12)
           .text("Fashion Store", {
               align: "center"
           });

        doc.moveDown(2);

        // ======================
        // INVOICE INFO
        // ======================

        doc.fontSize(14);

        doc.text(`Invoice No: ${order.orderId}`);

        doc.text(
            `Date: ${order.createdAt.toDateString()}`
        );

        doc.moveDown();

        // ======================
        // CUSTOMER DETAILS
        // ======================

        doc.fontSize(16)
           .text("Customer Details");

        doc.moveDown(0.5);

        doc.fontSize(12);

        doc.text(
            `Customer: ${
                order.user?.firstName || "Unknown"
            } ${
                order.user?.lastName || ""
            }`
        );

        doc.text(
            `Email: ${
                order.user?.email || ""
            }`
        );

        // ======================
        // ADDRESS
        // ======================

        if (order.address) {

            doc.moveDown();

            doc.fontSize(16)
               .text("Delivery Address");

            doc.moveDown(0.5);

            doc.fontSize(12);

            doc.text(
                order.address.fullName || ""
            );

            doc.text(
                order.address.phone || ""
            );

            doc.text(
                order.address.line1 || ""
            );

            doc.text(
                `${order.address.city || ""}, ${order.address.state || ""}`
            );

            doc.text(
                order.address.pincode || ""
            );
        }

        doc.moveDown();

        doc.moveTo(50, doc.y)
           .lineTo(550, doc.y)
           .stroke();

        doc.moveDown();

        // ======================
        // ORDER ITEMS
        // ======================

        doc.fontSize(16)
           .text("Order Items");

        doc.moveDown();

        order.items.forEach(item => {

            doc.fontSize(12)
               .text(
                   item.product?.productName ||
                   "Deleted Product",
                   50,
                   doc.y,
                   { continued: true }
               )
               .text(
                   `Qty: ${item.quantity}`,
                   300,
                   doc.y,
                   { continued: true }
               )
               .text(
                   `Rs. ${item.price}`,
                   450,
                   doc.y
               );

            doc.moveDown(0.5);
        });

        doc.moveDown();

        doc.moveTo(50, doc.y)
           .lineTo(550, doc.y)
           .stroke();

        doc.moveDown();

        // ======================
        // TOTALS
        // ======================

        doc.fontSize(12)
           .text(
               `Subtotal: Rs. ${order.subtotal}`,
               {
                   align: "right"
               }
           );

        doc.text(
            `Tax: Rs. ${order.tax}`,
            {
                align: "right"
            }
        );

        doc.text(
            `Shipping: Rs. ${order.shipping}`,
            {
                align: "right"
            }
        );

        doc.fontSize(16)
           .text(
               `Grand Total: Rs. ${order.grandTotal}`,
               {
                   align: "right"
               }
           );

        doc.moveDown();

        // ======================
        // PAYMENT INFO
        // ======================

        doc.fontSize(12);

        doc.text(
            `Payment Method: ${order.paymentMethod}`
        );

        doc.text(
            `Status: ${order.status}`
        );

        doc.moveDown(2);

        doc.text(
            "Thank you for shopping with Alder & Ash!",
            {
                align: "center"
            }
        );

        doc.end();

    } catch (error) {

        console.log(error);

        res.status(500).send(
            "Server Error"
        );
    }
};
export const renderAdminOrders = async (req, res) => {
    try {

        const search = req.query.search || "";
        const status = req.query.status || "";
        const sort = req.query.sort || "latest";
        const page = Number(req.query.page) || 1;
        const limit = 5;
        
        let query = {};
        
        if (search) {
            query.orderId = {
                $regex: search,
                $options: "i"
            };
        }
        
        if (status) {
            query.status = status;
        }
        


        let sortOption = { createdAt: -1 };

        if (sort === "oldest") {
        sortOption = { createdAt: 1 };
}
        const orders = await Order.find(query)
        .populate("user")
        .populate("items.product")
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit);

        const totalOrders = await Order.countDocuments(query);

            const totalPages = Math.ceil(
                totalOrders / limit
            );
            const deliveredCount = await Order.countDocuments({
                status: "DELIVERED"
            });
            
            const placedCount = await Order.countDocuments({
                status: "PLACED"
            });
            
            const revenueData = await Order.aggregate([
                {
                    $match: {
                        status: "DELIVERED"
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: "$grandTotal"
                        }
                    }
                }
            ]);
            
            const revenue = revenueData[0]?.total || 0;
            

            res.render("admin/orders", {
                orders,
                search,
                status,
                sort,
                currentPage: page,
                totalPages,
                totalOrders,
                deliveredCount,
                placedCount,
                revenue
            });

    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};
export const renderAdminOrderDetails = async (req, res) => {
    try {

        const order = await Order.findOne({
            orderId: req.params.orderId
        })
        .populate("user")
        .populate("address")
        .populate("items.product");

        if (!order) {
            return res.status(404).send(
                "Order not found"
            );
        }

        res.render(
            "admin/order-details",
            { order }
        );

    } catch (error) {

        console.log(error);

        res.status(500).send(
            "Server Error"
        );
    }
};
export const updateOrderStatus = async (req, res) => {

    try {

        const { orderId } = req.params;
        const { status } = req.body;

        const order = await Order.findOne({
            orderId
        });

        if (!order) {
            return res.status(404).send(
                "Order not found"
            );
        }

        // =========================
        // RETURN APPROVAL
        // =========================

        if (status === "RETURNED") {

            const returnItems =
                order.items.filter(
                    item =>
                        item.status ===
                        "RETURN_REQUESTED"
                );

            if (returnItems.length === 0) {
                return res.status(400).send(
                    "No items are waiting for return approval."
                );
            }

            // =========================
            // CALCULATE REFUND
            // =========================

            let refundAmount = 0;

            for (const item of returnItems) {

                refundAmount +=
                    item.price *
                    item.quantity;
            }

            const remainingRefundable =
                Math.max(
                    0,
                    order.grandTotal -
                    (order.refundedAmount || 0)
                );

            refundAmount =
                Math.min(
                    refundAmount,
                    remainingRefundable
                );

            // =========================
            // RESTORE STOCK
            // =========================

            for (const item of returnItems) {

                const product =
                    await Product.findById(
                        item.product
                    );

                if (product) {

                    const variant =
                        product.variants.find(
                            v =>
                                v.size === item.size &&
                                v.color === item.color
                        );

                    if (variant) {
                        variant.stock +=
                            item.quantity;
                    }

                    await product.save();
                }

                item.status = "RETURNED";
            }

            // =========================
            // REFUND TO WALLET
            // =========================

            if (
                (
                    order.paymentMethod === "RAZORPAY" ||
                    order.paymentMethod === "WALLET" ||
                    order.paymentMethod === "COD"
                ) &&
                order.paymentStatus === "PAID" &&
                refundAmount > 0
            ) {

                let wallet =
                    await Wallet.findOne({
                        user: order.user
                    });

                if (!wallet) {

                    wallet =
                        await Wallet.create({

                            user:
                                order.user,

                            walletId:
                                `WALLET-${Date.now()}`,

                            balance: 0,

                            transactions: []
                        });
                }

                wallet.balance +=
                    refundAmount;

                wallet.transactions.push({

                    type: "CREDIT",

                    amount:
                        refundAmount,

                    balanceAfter:
                        wallet.balance,

                    description:
                        `Refund for returned item(s) from order ${order.orderId}`,

                    orderId:
                        order.orderId
                });

                await wallet.save();

                // RECORD FOR SALES REPORT
                order.refundedAmount =
                    (order.refundedAmount || 0) +
                    refundAmount;

                if (
                    order.refundedAmount >=
                    order.grandTotal
                ) {
                    order.paymentStatus =
                        "REFUNDED";
                }
            }

            // =========================
            // OVERALL ORDER STATUS
            // =========================

            const activeItems =
                order.items.filter(
                    item =>
                        item.status !== "CANCELLED"
                );

            const allReturned =
                activeItems.length > 0 &&
                activeItems.every(
                    item =>
                        item.status === "RETURNED"
                );

            if (allReturned) {
                order.status = "RETURNED";
            } else {
                order.status = "DELIVERED";
            }

        } else {

            // =========================
            // NORMAL ADMIN STATUS UPDATE
            // =========================

            order.status = status;

            // COD is considered paid once delivered
            if (
                status === "DELIVERED" &&
                order.paymentMethod === "COD"
            ) {
                order.paymentStatus = "PAID";
            }
        }

        await order.save();

        res.redirect(
            "/api/orders/admin/orders"
        );

    } catch (error) {

        console.log(
            "UPDATE ORDER STATUS ERROR:",
            error
        );

        res.status(500).send(
            "Server Error"
        );
    }
};
export const approveReturn = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findOne({
            orderId
        });

        if (!order) {
            return res.status(404).send(
                "Order not found"
            );
        }

        // Only items actually waiting for return approval
        const returnItems = order.items.filter(
            item =>
                item.status === "RETURN_REQUESTED"
        );

        if (returnItems.length === 0) {
            return res.status(400).send(
                "No items are waiting for return approval."
            );
        }

        // =========================
        // CALCULATE REFUND
        // =========================

        let refundAmount = 0;

        for (const item of returnItems) {
            refundAmount +=
                item.price * item.quantity;
        }

        /*
         * Never refund more than the customer
         * actually paid on the order.
         *
         * This also protects against multiple
         * cancellation/return refunds.
         */
        const remainingRefundable =
            Math.max(
                0,
                order.grandTotal -
                (order.refundedAmount || 0)
            );

        refundAmount =
            Math.min(
                refundAmount,
                remainingRefundable
            );

        // =========================
        // RESTORE STOCK
        // =========================

        for (const item of returnItems) {

            const product =
                await Product.findById(
                    item.product
                );

            if (product) {

                const variant =
                    product.variants.find(
                        v =>
                            v.size === item.size &&
                            v.color === item.color
                    );

                if (variant) {
                    variant.stock +=
                        item.quantity;
                }

                await product.save();
            }

            // Only returned items change status
            item.status = "RETURNED";
        }

        // =========================
        // REFUND TO WALLET
        // =========================

        if (
            (
                order.paymentMethod === "RAZORPAY" ||
                order.paymentMethod === "WALLET"
            ) &&
            order.paymentStatus === "PAID" &&
            refundAmount > 0
        ) {

            let wallet =
                await Wallet.findOne({
                    user: order.user
                });

            if (!wallet) {
                wallet =
                    await Wallet.create({
                        user: order.user,

                        walletId:
                            `WALLET-${Date.now()}`,

                        balance: 0,

                        transactions: []
                    });
            }

            wallet.balance += refundAmount;

            wallet.transactions.push({
                type: "CREDIT",

                amount: refundAmount,

                balanceAfter:
                    wallet.balance,

                description:
                    `Refund for returned item(s) from order ${order.orderId}`,

                orderId:
                    order.orderId
            });

            await wallet.save();

            // Record refund for sales report
            order.refundedAmount =
                (order.refundedAmount || 0) +
                refundAmount;

            /*
             * Mark fully refunded only when
             * cumulative refunds reach order total.
             */
            if (
                order.refundedAmount >=
                order.grandTotal
            ) {
                order.paymentStatus =
                    "REFUNDED";
            }
        }

        // =========================
        // UPDATE OVERALL ORDER STATUS
        // =========================

        const activeItems =
            order.items.filter(
                item =>
                    item.status !== "CANCELLED"
            );

        const allReturned =
            activeItems.length > 0 &&
            activeItems.every(
                item =>
                    item.status === "RETURNED"
            );

        if (allReturned) {
            order.status = "RETURNED";
        } else {
            /*
             * Some items are still kept by
             * the customer.
             *
             * Keep the overall order delivered
             * so another delivered item can
             * still be returned later.
             */
            order.status = "DELIVERED";
        }

        await order.save();

        res.redirect(
            `/api/orders/admin/details/${order.orderId}`
        );

    } catch (error) {

        console.log(
            "APPROVE RETURN ERROR:",
            error
        );

        res.status(500).send(
            "Server Error"
        );
    }
};
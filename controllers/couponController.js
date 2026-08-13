import Coupon from "../models/couponModel.js";
import Cart from "../models/cartModel.js";

export const createCoupon = async (req, res) => {
    try {

        const {
            code,
            name,
            description,
            discountType,
            discountValue,
            minimumOrderAmount,
            maximumDiscount,
            usageLimit,
            startDate,
            endDate
        } = req.body;

        // Check required fields
        if (
            !code ||
            !name ||
            !discountType ||
            !discountValue ||
            !startDate ||
            !endDate
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields"
            });
        }

        // Check discount type
        if (
            discountType !== "PERCENTAGE" &&
            discountType !== "FIXED"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid discount type"
            });
        }

        // Percentage cannot be more than 100
        if (
            discountType === "PERCENTAGE" &&
            Number(discountValue) > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Percentage discount cannot exceed 100%"
            });
        }

        // Discount cannot be negative
        if (Number(discountValue) < 0) {
            return res.status(400).json({
                success: false,
                message: "Discount value cannot be negative"
            });
        }

        // Check dates
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end <= start) {
            return res.status(400).json({
                success: false,
                message: "End date must be after start date"
            });
        }

        // Check if coupon already exists
        const existingCoupon = await Coupon.findOne({
            code: code.trim().toUpperCase()
        });

        if (existingCoupon) {
            return res.status(400).json({
                success: false,
                message: "Coupon code already exists"
            });
        }

        // Create coupon
        const coupon = await Coupon.create({

            code: code.trim().toUpperCase(),

            name: name.trim(),

            description: description || "",

            discountType,

            discountValue: Number(discountValue),

            minimumOrderAmount:
                Number(minimumOrderAmount) || 0,

            maximumDiscount:
                maximumDiscount
                    ? Number(maximumDiscount)
                    : null,

            usageLimit:
                usageLimit
                    ? Number(usageLimit)
                    : null,

            usedCount: 0,

            startDate: start,

            endDate: end,

            status: "ACTIVE"
        });

        res.status(201).json({
            success: true,
            message: "Coupon created successfully",
            coupon
        });

    } catch (error) {

        console.log(
            "CREATE COUPON ERROR:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


export const getCoupons = async (req, res) => {
    try {

        const coupons = await Coupon.find()
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            coupons
        });

    } catch (error) {

        console.log(
            "GET COUPONS ERROR:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


export const deleteCoupon = async (req, res) => {
    try {

        const { id } = req.params;

        const coupon = await Coupon.findById(id);

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: "Coupon not found"
            });
        }

        await Coupon.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Coupon deleted successfully"
        });

    } catch (error) {

        console.log(
            "DELETE COUPON ERROR:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};
export const applyCoupon = async (req, res) => {
    try {

        const userId = req.session.user.id;
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: "Please enter a coupon code"
            });
        }

        const cart = await Cart.findOne({
            user: userId
        });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Your cart is empty"
            });
        }

        if (cart.coupon) {
            return res.status(400).json({
                success: false,
                message: "A coupon is already applied"
            });
        }

        const coupon = await Coupon.findOne({
            code: code.trim().toUpperCase()
        });

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: "Invalid coupon code"
            });
        }

        if (coupon.status !== "ACTIVE") {
            return res.status(400).json({
                success: false,
                message: "This coupon is inactive"
            });
        }

        const now = new Date();

        if (
            now < coupon.startDate ||
            now > coupon.endDate
        ) {
            return res.status(400).json({
                success: false,
                message: "This coupon has expired or is not active yet"
            });
        }

        if (
            coupon.usageLimit !== null &&
            coupon.usedCount >= coupon.usageLimit
        ) {
            return res.status(400).json({
                success: false,
                message: "This coupon usage limit has been reached"
            });
        }

        if (
            cart.subTotal < coupon.minimumOrderAmount
        ) {
            return res.status(400).json({
                success: false,
                message:
                    `Minimum order amount is ₹${coupon.minimumOrderAmount}`
            });
        }

        let discount = 0;

        if (coupon.discountType === "PERCENTAGE") {

            discount =
                (cart.subTotal * coupon.discountValue) / 100;

            if (
                coupon.maximumDiscount !== null &&
                discount > coupon.maximumDiscount
            ) {
                discount = coupon.maximumDiscount;
            }

        } else if (coupon.discountType === "FIXED") {

            discount = coupon.discountValue;

            if (discount > cart.subTotal) {
                discount = cart.subTotal;
            }
        }

        discount = Math.round(discount * 100) / 100;

        cart.coupon = coupon._id;
        cart.couponDiscount = discount;

        cart.grandTotal =
            cart.subTotal +
            cart.tax +
            cart.shipping -
            discount;
            console.log("SUBTOTAL:", cart.subTotal);
console.log("TAX:", cart.tax);
console.log("SHIPPING:", cart.shipping);
console.log("DISCOUNT:", discount);
console.log("GRAND TOTAL:", cart.grandTotal);

        await cart.save();

        res.status(200).json({
            success: true,
            message: "Coupon applied successfully",
            data: {
                couponCode: coupon.code,
                discount: discount,
                grandTotal: cart.grandTotal
            }
        });

    } catch (error) {

        console.log(
            "APPLY COUPON ERROR:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};
export const removeCoupon = async (req, res) => {
    try {

        const userId = req.session.user.id;

        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        // Remove coupon
        cart.coupon = null;

        // Reset discount
        cart.discount = 0;

        // Recalculate total
        cart.grandTotal =
            cart.subTotal +
            cart.tax +
            cart.shipping;

        await cart.save();

        res.json({
            success: true,
            message: "Coupon removed successfully",
            data: {
                subTotal: cart.subTotal,
                tax: cart.tax,
                shipping: cart.shipping,
                discount: 0,
                grandTotal: cart.grandTotal
            }
        });

    } catch (error) {

        console.log("REMOVE COUPON ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Unable to remove coupon"
        });
    }
};
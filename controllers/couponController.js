import Coupon from "../models/couponModel.js";
import Cart from "../models/cartModel.js";
import STATUS_CODES from "../constants/statusCodes.js";

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

        
        if (
            !code ||
            !name ||
            !discountType ||
            !discountValue ||
            !startDate ||
            !endDate
        ) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: "Please fill all required fields"
            });
        }

        
        if (
            discountType !== "PERCENTAGE" &&
            discountType !== "FIXED"
        ) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: "Invalid discount type"
            });
        }

        
        if (
            discountType === "PERCENTAGE" &&
            Number(discountValue) > 100
        ) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: "Percentage discount cannot exceed 100%"
            });
        }

        
        if (Number(discountValue) < 0) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: "Discount value cannot be negative"
            });
        }

        
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end <= start) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: "End date must be after start date"
            });
        }

        
        const existingCoupon = await Coupon.findOne({
            code: code.trim().toUpperCase()
        });

        if (existingCoupon) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: "Coupon code already exists"
            });
        }

        
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

        res.status(STATUS_CODES.CREATED).json({
            success: true,
            message: "Coupon created successfully",
            coupon
        });

    } catch (error) {

        console.log(
            "CREATE COUPON ERROR:",
            error.message
        );

        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Server error"
        });
    }
};


export const getCoupons = async (req, res) => {
    try {

        const coupons = await Coupon.find()
            .sort({ createdAt: -1 });

        res.status(STATUS_CODES.OK).json({
            success: true,
            coupons
        });

    } catch (error) {

        console.log(
            "GET COUPONS ERROR:",
            error.message
        );

        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
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
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success: false,
                message: "Coupon not found"
            });
        }

        await Coupon.findByIdAndDelete(id);

        res.status(STATUS_CODES.OK).json({
            success: true,
            message: "Coupon deleted successfully"
        });

    } catch (error) {

        console.log(
            "DELETE COUPON ERROR:",
            error.message
        );

        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Server error"
        });
    }
};
export const updateCoupon = async (req, res) => {
    try {

        const { id } = req.params;

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
            endDate,
            status
        } = req.body;

        const coupon = await Coupon.findById(id);

        if (!coupon) {
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success: false,
                message: "Coupon not found"
            });
        }

        if (
            !code ||
            !name ||
            !discountType ||
            !discountValue ||
            !startDate ||
            !endDate
        ) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: "Please fill all required fields"
            });
        }

        if (
            discountType !== "PERCENTAGE" &&
            discountType !== "FIXED"
        ) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: "Invalid discount type"
            });
        }

        if (
            discountType === "PERCENTAGE" &&
            Number(discountValue) > 100
        ) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: "Percentage discount cannot exceed 100%"
            });
        }

        if (Number(discountValue) < 0) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: "Discount value cannot be negative"
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end <= start) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: "End date must be after start date"
            });
        }

        const duplicateCoupon = await Coupon.findOne({
            code: code.trim().toUpperCase(),
            _id: { $ne: id }
        });

        if (duplicateCoupon) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: "Coupon code already exists"
            });
        }

        coupon.code = code.trim().toUpperCase();
        coupon.name = name.trim();
        coupon.description = description || "";
        coupon.discountType = discountType;
        coupon.discountValue = Number(discountValue);
        coupon.minimumOrderAmount =
            Number(minimumOrderAmount) || 0;

        coupon.maximumDiscount =
            maximumDiscount
                ? Number(maximumDiscount)
                : null;

        coupon.usageLimit =
            usageLimit
                ? Number(usageLimit)
                : null;

        coupon.startDate = start;
        coupon.endDate = end;

        if (status) {
            coupon.status = status;
        }

        await coupon.save();

        res.status(STATUS_CODES.OK).json({
            success: true,
            message: "Coupon updated successfully",
            coupon
        });

    } catch (error) {

        console.log(
            "UPDATE COUPON ERROR:",
            error.message
        );

        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Server error"
        });
    }
};
export const getAvailableCoupons = async (req, res) => {
    try {
        const userId = req.session.user.id;

        const cart = await Cart.findOne({
            user: userId
        });

        if (!cart || cart.items.length === 0) {
            return res.status(STATUS_CODES.OK).json({
                success: true,
                coupons: []
            });
        }

        const currentSubTotal = cart.items.reduce(
            (total, item) =>
                total + (item.price * item.quantity),
            0
        );

        const now = new Date();

        const coupons = await Coupon.find({
            status: "ACTIVE",

            startDate: {
                $lte: now
            },

            endDate: {
                $gte: now
            },

            minimumOrderAmount: {
                $lte: currentSubTotal
            },

            $or: [
                {
                    usageLimit: null
                },
                {
                    $expr: {
                        $lt: [
                            "$usedCount",
                            "$usageLimit"
                        ]
                    }
                }
            ]
        })
        .sort({
            createdAt: -1
        });

        const availableCoupons = coupons.filter(
            coupon => {

                let discount = 0;

                if (
                    coupon.discountType ===
                    "PERCENTAGE"
                ) {
                    discount =
                        (
                            currentSubTotal *
                            coupon.discountValue
                        ) / 100;

                    if (
                        coupon.maximumDiscount !== null &&
                        discount > coupon.maximumDiscount
                    ) {
                        discount =
                            coupon.maximumDiscount;
                    }

                } else if (
                    coupon.discountType ===
                    "FIXED"
                ) {
                    discount =
                        coupon.discountValue;
                }

                return discount < currentSubTotal;
            }
        );

        return res.status(STATUS_CODES.OK).json({
            success: true,
            coupons: availableCoupons
        });

    } catch (error) {

        console.log(
            "GET AVAILABLE COUPONS ERROR:",
            error.message
        );

        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message:
                "Unable to load available coupons"
        });
    }
};
export const applyCoupon = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { code } = req.body;

        if (!code) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: "Please enter a coupon code"
            });
        }

        const cart = await Cart.findOne({
            user: userId
        });

        if (!cart || cart.items.length === 0) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: "Your cart is empty"
            });
        }

        if (cart.coupon) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: "A coupon is already applied"
            });
        }

        const coupon = await Coupon.findOne({
            code: code.trim().toUpperCase()
        });

        if (!coupon) {
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success: false,
                message: "Invalid coupon code"
            });
        }

        if (coupon.status !== "ACTIVE") {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: "This coupon is inactive"
            });
        }

        const now = new Date();

        if (
            now < coupon.startDate ||
            now > coupon.endDate
        ) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message:
                    "This coupon has expired or is not active yet"
            });
        }

        if (
            coupon.usageLimit !== null &&
            coupon.usedCount >= coupon.usageLimit
        ) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message:
                    "This coupon usage limit has been reached"
            });
        }


        const currentSubTotal = cart.items.reduce(
            (total, item) =>
                total + (item.price * item.quantity),
            0
        );

        cart.subTotal = currentSubTotal;

        if (
            currentSubTotal <
            coupon.minimumOrderAmount
        ) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message:
                    `Minimum order amount is ₹${coupon.minimumOrderAmount}`
            });
        }

        let discount = 0;

        if (
            coupon.discountType === "PERCENTAGE"
        ) {
            discount =
                (
                    currentSubTotal *
                    coupon.discountValue
                ) / 100;

            if (
                coupon.maximumDiscount !== null &&
                discount > coupon.maximumDiscount
            ) {
                discount =
                    coupon.maximumDiscount;
            }

        } else if (
            coupon.discountType === "FIXED"
        ) {
            discount = coupon.discountValue;
        }

        discount =
            Math.round(discount * 100) / 100;

        
        if (discount >= currentSubTotal) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message:
                    "Coupon discount must be less than the cart subtotal"
            });
        }

        cart.coupon = coupon._id;
        cart.couponDiscount = discount;

        cart.tax =
            Math.round(currentSubTotal * 0.05);

        cart.shipping =
            currentSubTotal > 1000
                ? 0
                : 100;

        cart.grandTotal =
            currentSubTotal +
            cart.tax +
            cart.shipping -
            discount;

        await cart.save();

        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: "Coupon applied successfully",
            data: {
                couponCode: coupon.code,
                discount: discount,
                subTotal: cart.subTotal,
                tax: cart.tax,
                shipping: cart.shipping,
                grandTotal: cart.grandTotal
            }
        });

    } catch (error) {
        console.log(
            "APPLY COUPON ERROR:",
            error.message
        );

        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Server error"
        });
    }
};
export const removeCoupon = async (req, res) => {
    try {
        const userId = req.session.user.id;

        const cart = await Cart.findOne({
            user: userId
        });

        if (!cart) {
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success: false,
                message: "Cart not found"
            });
        }

        cart.coupon = null;
        cart.couponDiscount = 0;

        cart.grandTotal =
            cart.subTotal +
            cart.tax +
            cart.shipping;

        await cart.save();

        return res.status(STATUS_CODES.OK).json({
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
        console.log(
            "REMOVE COUPON ERROR:",
            error.message
        );

        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Unable to remove coupon"
        });
    }
};
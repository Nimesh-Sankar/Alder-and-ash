import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },

    size: {
        type: String,
        required: true
    },

    color: {
        type: String,
        required: true
    },

    quantity: {
        type: Number,
        required: true
    },

    price: {
        type: Number,
        required: true
    },
    
    status: {
        type: String,
        enum: [
            "PLACED",
            "CANCELLED",
            "RETURN_REQUESTED",
            "RETURNED",
            "ORDER_FAILED"
        ],
        default: "PLACED"
    }
});

const orderSchema = new mongoose.Schema({

    orderId: {
        type: String,
        unique: true,
        required: true
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    items: [orderItemSchema],

    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
        required: true
    },

    couponCode: {
        type: String,
        default: null
    },
    
    couponDiscount: {
        type: Number,
        default: 0
    },
    paymentMethod: {
        type: String,
        enum: ["COD", "RAZORPAY", "WALLET"],
        default: "COD"
    },
    
    paymentStatus: {
        type: String,
        enum: [
            "PENDING",
            "PAID",
            "FAILED",
            "REFUNDED"
        ],
        default: "PENDING"
    },
    
    transactionId: {
        type: String,
        default: null
    },

    subtotal: {
        type: Number,
        required: true
    },

    tax: {
        type: Number,
        default: 0
    },

    shipping: {
        type: Number,
        default: 0
    },

    grandTotal: {
        type: Number,
        required: true
    },
    refundedAmount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: [
            "PLACED",
            "PROCESSING",
            "SHIPPED",
            "DELIVERED",
            "RETURN_REQUESTED",
            "RETURNED",
            "CANCELLED",
            "ORDER_FAILED"
        ],
        default: "PLACED"
    },

    cancellationReason: {
        type: String,
        default: null
    },

    returnReason: {
        type: String,
        default: null
    }

}, {
    timestamps: true
});

export default mongoose.model(
    "Order",
    orderSchema
);
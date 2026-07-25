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
            "RETURNED"
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

    paymentMethod: {
        type: String,
        enum: ["COD"],
        default: "COD"
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

    status: {
        type: String,
        enum: [
            "PLACED",
            "PROCESSING",
            "SHIPPED",
            "DELIVERED",
            "RETURN_REQUESTED",
            "RETURNED",
            "CANCELLED"
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
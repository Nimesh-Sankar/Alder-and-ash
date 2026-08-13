import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },

    name: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        default: ""
    },

    discountType: {
        type: String,
        enum: ["PERCENTAGE", "FIXED"],
        required: true
    },

    discountValue: {
        type: Number,
        required: true,
        min: 0
    },

    minimumOrderAmount: {
        type: Number,
        default: 0,
        min: 0
    },

    maximumDiscount: {
        type: Number,
        default: null
    },

    usageLimit: {
        type: Number,
        default: null
    },

    usedCount: {
        type: Number,
        default: 0
    },

    startDate: {
        type: Date,
        required: true
    },

    endDate: {
        type: Date,
        required: true
    },

    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE"],
        default: "ACTIVE"
    }

}, {
    timestamps: true
});

export default mongoose.model("Coupon", couponSchema);
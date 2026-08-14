import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["CREDIT", "DEBIT"],
        required: true
    },

    amount: {
        type: Number,
        required: true
    },

    balanceAfter: {
        type: Number,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    orderId: {
        type: String,
        default: null
    }

}, {
    timestamps: true
});


const walletSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },

    walletId: {
        type: String,
        unique: true
    },

    balance: {
        type: Number,
        default: 0
    },

    transactions: [
        transactionSchema
    ]

}, {
    timestamps: true
});


const Wallet = mongoose.model(
    "Wallet",
    walletSchema
);

export default Wallet;
import mongoose from "mongoose";

const cartItemSchema =
  new mongoose.Schema({

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
      default: 1,
      min: 1
    },

    price: {
      type: Number,
      required: true
    }

  });

const cartSchema =
  new mongoose.Schema({

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null
    },
    couponDiscount: {
      type: Number,
      default: 0
  },

    items: [cartItemSchema],

    subTotal: {
      type: Number,
      default: 0
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
      default: 0
    }

  },
  {
    timestamps: true
  }
);

export default mongoose.model(
  "Cart",
  cartSchema
);
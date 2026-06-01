import mongoose from "mongoose";

const productSchema = new mongoose.Schema({

  productName: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    required: true
  },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
  },

  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Brand",
    required: true
  },

  variants: [
    {

      size: {
        type: String,
        required: true
      },

      color: {
        type: String,
        required: true
      },

      price: {
        type: Number,
        required: true
      },

      stock: {
        type: Number,
        required: true
      }

    }
  ],

  images:{
    type: [String],
    default: []
  },

  isBlocked: {
    type: Boolean,
    default: false
  },

  isDeleted: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true
});

const Product =
  mongoose.model(
    "Product",
    productSchema
  );

export default Product;
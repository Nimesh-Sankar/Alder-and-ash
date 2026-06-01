import mongoose from "mongoose";

const brandSchema = new mongoose.Schema({

  brandName: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },

  description: {
    type: String,
    required: true
  },

  image: {
    type: String,
    default: ""
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

const Brand = mongoose.model(
  "Brand",
  brandSchema
);

export default Brand;
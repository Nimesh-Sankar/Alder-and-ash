import Offer from "../models/offerModel.js";
import Product from "../models/productModel.js";
import Category from "../models/categoryModel.js";

export const createOffer = async (req, res) => {
    try {
        const {
            name,
            discountType,
            discountValue,
            startDate,
            endDate,
            productId,
            categoryId
        } = req.body;

        if (!name || !discountType || !discountValue || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be provided"
            });
        }

        if (!["PERCENTAGE", "FIXED"].includes(discountType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid discount type"
            });
        }

        if (Number(discountValue) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Discount must be greater than 0"
            });
        }

        if (new Date(startDate) >= new Date(endDate)) {
            return res.status(400).json({
                success: false,
                message: "End date must be after start date"
            });
        }

        if (!productId && !categoryId) {
            return res.status(400).json({
                success: false,
                message: "Select a product or category"
            });
        }

        if (productId && categoryId) {
            return res.status(400).json({
                success: false,
                message: "Offer can target either a product or category"
            });
        }

        if (productId) {
            const product = await Product.findById(productId);

            if (!product || product.isDeleted) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found"
                });
            }
        }

        if (categoryId) {
            const category = await Category.findById(categoryId);

            if (!category || category.isDeleted) {
                return res.status(404).json({
                    success: false,
                    message: "Category not found"
                });
            }
        }

        if (
            discountType === "PERCENTAGE" &&
            Number(discountValue) > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Percentage discount cannot exceed 100%"
            });
        }

        const offer = await Offer.create({
          name: name.trim(),
          type: productId ? "PRODUCT" : "CATEGORY",
          discountType,
          discountValue: Number(discountValue),
          startDate,
          endDate,
          product: productId || null,
          category: categoryId || null,
          isActive: true
      });

        res.status(201).json({
            success: true,
            message: "Offer created successfully",
            offer
        });

    } catch (error) {
        console.log("CREATE OFFER ERROR:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to create offer"
        });
    }
};

export const getOffers = async (req, res) => {
    try {
        const offers = await Offer.find()
            .populate("product", "productName")
            .populate("category", "name")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            offers
        });

    } catch (error) {
        console.log("GET OFFERS ERROR:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to load offers"
        });
    }
};

export const deleteOffer = async (req, res) => {
    try {
        const { id } = req.params;

        const offer = await Offer.findById(id);

        if (!offer) {
            return res.status(404).json({
                success: false,
                message: "Offer not found"
            });
        }

        await Offer.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Offer deleted successfully"
        });

    } catch (error) {
        console.log("DELETE OFFER ERROR:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to delete offer"
        });
    }
};

export const toggleOfferStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const offer = await Offer.findById(id);

        if (!offer) {
            return res.status(404).json({
                success: false,
                message: "Offer not found"
            });
        }

        offer.isActive = !offer.isActive;

        await offer.save();

        res.status(200).json({
            success: true,
            message: "Offer status updated",
            isActive: offer.isActive
        });

    } catch (error) {
        console.log("TOGGLE OFFER ERROR:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to update offer status"
        });
    }
};
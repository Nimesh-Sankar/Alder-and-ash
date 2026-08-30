import Wishlist from "../models/Wishlist.js";
import Product from "../models/productModel.js";
import STATUS_CODES from "../constants/statusCodes.js";

export const addToWishlist = async (req, res) => {
  try {

      const userId = req.user._id;
      const { productId } = req.body;

      const product = await Product.findById(productId);

      if (!product || product.isDeleted || product.isListed === false) {
          return res.status(STATUS_CODES.BAD_REQUEST).json({
              message: "Product is not available"
          });
      }

      const hasStock = product.variants.some(
          (variant) => variant.stock > 0
      );

      if (!hasStock) {
          return res.status(STATUS_CODES.BAD_REQUEST).json({
              message: "This product is out of stock"
          });
      }

      let wishlist = await Wishlist.findOne({
          user: userId
      });

      if (!wishlist) {
          wishlist = await Wishlist.create({
              user: userId,
              products: []
          });
      }

      if (!wishlist.products.includes(productId)) {
          wishlist.products.push(productId);
          await wishlist.save();
      }

      res.status(STATUS_CODES.OK).json({
          message: "Product added to wishlist",
          wishlist
      });

  } catch (error) {

      console.error("Error adding to wishlist:", error);

      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
          message: "Internal server error"
      });
  }
};

export const removeFromWishlist=async(req,res)=>{
  try{
    const userId=req.user._id;
    const {productId}=req.body;

    const wishlist=await Wishlist.findOne({user:userId});
    if(!wishlist){
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: "Wishlist not found" });
    }
    wishlist.products=wishlist.products.filter((id)=>id.toString()!==productId);
    await wishlist.save();

    res.status(STATUS_CODES.OK).json({ message: "Product removed from wishlist", wishlist });
  } catch  {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
  }
};

export const getWishlist=async(req,res)=>{
  try{
    const userId=req.user._id;
    const wishlist=await Wishlist.findOne({user:userId}).populate("products");
    if(!wishlist){
      return res.status(STATUS_CODES.NOT_FOUND).json({ message: "Wishlist not found" });
    }

    res.status(STATUS_CODES.OK).json({ message: "Wishlist retrieved successfully", wishlist });
  } catch  {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
  }
};

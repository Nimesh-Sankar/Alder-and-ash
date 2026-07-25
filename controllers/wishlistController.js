import Wishlist from "../models/Wishlist.js";

export const addToWishlist=async(req,res)=>{
  try{
    
    const userId=req.user._id;
    const {productId}=req.body;

    const wishlist=await Wishlist.findOne({user:userId});
    if(!wishlist){
      wishlist =await Wishlist.create({user:userId,products:[]});
    }
    if(!wishlist.products.includes(productId)){
      wishlist.products.push(productId);
      await wishlist.save();
    }

    res.status(200).json({ message: "Product added to wishlist", wishlist });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const removeFromWishlist=async(req,res)=>{
  try{
    const userId=req.user._id;
    const {productId}=req.body;

    const wishlist=await Wishlist.findOne({user:userId});
    if(!wishlist){
      return res.status(404).json({ message: "Wishlist not found" });
    }
    wishlist.products=wishlist.products.filter((id)=>id.toString()!==productId);
    await wishlist.save();

    res.status(200).json({ message: "Product removed from wishlist", wishlist });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getWishlist=async(req,res)=>{
  try{
    const userId=req.user._id;
    const wishlist=await Wishlist.findOne({user:userId}).populate("products");
    if(!wishlist){
      return res.status(404).json({ message: "Wishlist not found" });
    }

    res.status(200).json({ message: "Wishlist retrieved successfully", wishlist });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

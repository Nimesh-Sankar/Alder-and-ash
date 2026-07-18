import express from "express";
import { addToWishlist, getWishlist, removeFromWishlist } from "../controllers/wishlistController.js";
const router = express.Router();
const setUserFromHeader = (req, res, next) => {
  const userId=req.headers.userid;
  if(!userId){
    return res.status(401).json({ message: "User not logged in" });
  }
 req.user={_id:userId};
  next();
};
router.post("/add", setUserFromHeader, addToWishlist);
router.post("/remove", setUserFromHeader, removeFromWishlist);
router.get("/", setUserFromHeader, getWishlist);
export default router;
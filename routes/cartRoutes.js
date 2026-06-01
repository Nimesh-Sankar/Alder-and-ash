import express from "express";

import {addToCart,getCart,updateCartItem,removeCartItem} from "../controllers/cartController.js";

const router = express.Router();
const setUserFromHeader = (req, res, next) => {

  const userId =
    req.headers.userid;

  if (!userId) {

    return res.status(401).json({
      message: "User not logged in"
    });

  }

  req.user = {
    id: userId
  };

  next();

};

router.post(
  "/add",
  setUserFromHeader,
  addToCart
);

router.get(
  "/",
 setUserFromHeader,
  getCart
);

router.patch(
  "/items/:itemId",setUserFromHeader,
  updateCartItem
);

router.delete(
  "/items/:itemId",
  setUserFromHeader,
  removeCartItem
);

export default router;
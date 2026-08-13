import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js";
import Coupon from "../models/couponModel.js";

const MAX_CART_QUANTITY = 5;

function calculateTotals(cart) {

  cart.subTotal = cart.items.reduce(
      (total, item) =>
          total + item.price * item.quantity,
      0
  );

  cart.tax = Math.round(cart.subTotal * 0.05);

  cart.shipping =
      cart.subTotal > 1000 || cart.subTotal === 0
          ? 0
          : 100;

  cart.grandTotal =
      cart.subTotal +
      cart.tax +
      cart.shipping -
      (cart.couponDiscount || 0)

  if (cart.grandTotal < 0) {
      cart.grandTotal = 0;
  }
}

export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      productId,
      quantity = 1,
      size,
      color
    } = req.body;

    const product = await Product.findById(productId);

    if (!product || product.isDeleted) {
      return res.status(404).json({
        message: "Product not available"
      });
    }

    const variant = product.variants.find(
      (variant) =>
        variant.size === size &&
        variant.color === color
    );

    if (!variant) {
      return res.status(404).json({
        message: "Variant not found"
      });
    }
    if(variant.stock <= 0) {
      return res.status(400).json({
        message: "Out of stock"
      });
    }

    if (quantity > variant.stock) {
      return res.status(400).json({
        message: "Not enough stock"
      });
    }
    if (quantity > MAX_CART_QUANTITY) {

      return res.status(400).json({
        message:
          `Maximum ${MAX_CART_QUANTITY} quantity allowed`
      });
      
    }


    let cart = await Cart.findOne({
      user: userId
    });

    if (!cart) {
      cart = new Cart({
        user: userId,
        items: []
      });
    }

    const existingItem = cart.items.find(
      (item) =>
        item.product.toString() === productId &&
        item.size === size &&
        item.color === color
    );

    if (existingItem) {
      const newQuantity =
        existingItem.quantity + Number(quantity);

      if (newQuantity > variant.stock) {
        return res.status(400).json({
          message: "Only limited stock available"
        });
      }
      if (newQuantity > MAX_CART_QUANTITY) {

        return res.status(400).json({
          message:
            `Maximum ${MAX_CART_QUANTITY} quantity allowed`
        });
      
      }

      existingItem.quantity = newQuantity;
    } else {
      cart.items.push({
        product: productId,
        quantity: Number(quantity),
        size,
        color,
        price: variant.price
      });
    }

    calculateTotals(cart);

    await cart.save();

    res.status(200).json({
      message: "Product added to cart",
      cart
    });

  } catch (error) {
    console.log("ADD TO CART ERROR:", error.message);

    res.status(500).json({
      message: "Server error"
    });
  }
};

export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({
      user: userId
    }).populate("items.product");

   

    if (!cart) {
      return res.status(200).json({
        items: [],
        subTotal: 0,
        tax: 0,
        shipping: 0,
        grandTotal: 0
      });
    }
    for (const item of cart.items) {

      if (item.quantity < 1) {
        item.quantity = 1;
      }
    
      const product = item.product;
    
      if (!product || product.isDeleted||product.isListed===false) {
        item._doc.isUnavailable=true;
        item._doc.unavailableReason="Product unavailable"
        continue;
      }
    
      const variant = product.variants.find(
        (variant) =>
          variant.size === item.size &&
          variant.color === item.color
      );
    
      if (!variant || variant.stock <= 0) {
        item._doc.isUnavailable=true;
        item._doc.unavailableReason="out of stock"
        continue;
      }
    
      if (item.quantity > variant.stock) {
        item.quantity = variant.stock;
      }
    
    }
    calculateTotals(cart);
    await cart.save();

    res.status(200).json(cart);

  } catch (error) {
    console.log("GET CART ERROR:", error.message);

    res.status(500).json({
      message: "Server error"
    });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;

    const { itemId } = req.params;

    const { quantity } = req.body;

    const cart = await Cart.findOne({
      user: userId
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found"
      });
    }

    const item = cart.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        message: "Item not found"
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        message: "Quantity must be at least 1"
      });
    }
    if (quantity > MAX_CART_QUANTITY) {

      return res.status(400).json({
        message:
          `Maximum ${MAX_CART_QUANTITY} quantity allowed`
      });
    
    }

    const product = await Product.findById(
      item.product
    );

    if (!product || product.isDeleted) {
      return res.status(404).json({
        message: "Product not available"
      });
    }

    const variant = product.variants.find(
      (variant) =>
        variant.size === item.size &&
        variant.color === item.color
    );

    if (!variant) {
      return res.status(404).json({
        message: "Variant not found"
      });
    }
    if(variant.stock <= 0) {
      return res.status(400).json({
        message: "Out of stock"
      });
    }

    if (quantity > variant.stock) {
      return res.status(400).json({
        message: "Only limited stock available"
      });
    }

    item.quantity = Number(quantity);

    calculateTotals(cart);

    await cart.save();

    res.status(200).json({
      message: "Cart updated",
      cart
    });

  } catch (error) {
    console.log("UPDATE CART ERROR:", error.message);

    res.status(500).json({
      message: "Server error"
    });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const userId = req.user.id;

    const { itemId } = req.params;

    const cart = await Cart.findOne({
      user: userId
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found"
      });
    }

    cart.items = cart.items.filter(
      (item) =>
        item._id.toString() !== itemId
    );

    calculateTotals(cart);

    await cart.save();

    res.status(200).json({
      message: "Item removed",
      cart
    });

  } catch (error) {
    console.log("REMOVE CART ERROR:", error.message);

    res.status(500).json({
      message: "Server error"
    });
  }
};
export const removeCoupon = async (req, res) => {
  try {

      const userId = req.user.id;

      const cart = await Cart.findOne({
          user: userId
      });

      if (!cart) {
          return res.status(404).json({
              success: false,
              message: "Cart not found"
          });
      }

      cart.coupon = null;
      cart.couponDiscount = 0;

      calculateTotals(cart);

      await cart.save();

      res.status(200).json({
          success: true,
          message: "Coupon removed successfully",
          cart
      });

  } catch (error) {

      console.log(
          "REMOVE COUPON ERROR:",
          error.message
      );

      res.status(500).json({
          success: false,
          message: "Server error"
      });
  }
};

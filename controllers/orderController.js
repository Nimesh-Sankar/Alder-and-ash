import Order from "../models/orderModel.js";
import Cart from "../models/cartModel.js";
import Address from "../models/addressModel.js";
import Product from "../models/productModel.js";
import PDFDocument from "pdfkit";

export const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { addressId, couponCode, paymentMethod } = req.body;

        const address = await Address.findById(addressId);

        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        const cart = await Cart.findOne({ user: userId })
            .populate("items.product");

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            });
        }

    
        for (const item of cart.items) {
            const product = item.product;

            const variant = product.variants.find(
                variant =>
                    variant.size === item.size &&
                    variant.color === item.color
            );

            if (!variant || variant.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `${product.productName} is out of stock`
                });
            }
        }

        
        const orderCount = await Order.countDocuments();
        const orderId = `ORD${1000 + orderCount + 1}`;

        
        const order = await Order.create({
            orderId,
            user: userId,
        
            items: cart.items.map(item => ({
                product: item.product._id,
                size: item.size,
                color: item.color,
                quantity: item.quantity,
                price: item.price
            })),
        
            address: addressId,
    
            couponCode,
        
            paymentMethod,
        
            subtotal: cart.subTotal,
            tax: cart.tax,
            shipping: cart.shipping,
            grandTotal: cart.grandTotal,
        
            status: "PLACED"
        });

        
        for (const item of cart.items) {
            const product = await Product.findById(item.product._id);

            const variant = product.variants.find(
                variant =>
                    variant.size === item.size &&
                    variant.color === item.color
            );

            variant.stock -= item.quantity;
            await product.save();
        }

        
        cart.items = [];
        cart.subTotal = 0;
        cart.tax = 0;
        cart.shipping = 0;
        cart.grandTotal = 0;

        await cart.save();

        
        res.status(200).json({
            success: true,
            data: {
                orderId: order.orderId,
                status: order.status
            }
        });

    } catch (error) {
        console.log("PLACE ORDER ERROR:", error.message);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

export const getMyOrders = async (req, res) => {
  try{
    const userId = req.session.user.id;

    const orders = await Order.find({ user: userId })
    .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: orders
    });
  }catch(error){
    console.error(error);
    res.status(500).json({message: "Internal server error"});
  }
}
export const getOrderDetails = async (req, res) => {

  try {

      const { orderId } =
          req.params;

      const order =
          await Order.findOne({
              orderId
          })
          .populate("items.product")
          .populate("address");

      if (!order) {

          return res.status(404).json({
              success: false,
              message: "Order not found"
          });

      }

      res.status(200).json({
          success: true,
          order
      });

  } catch (error) {

      console.log(
          "GET ORDER DETAILS ERROR:",
          error.message
      );

      res.status(500).json({
          success: false,
          message: "Server Error"
      });

  }

};
export const renderOrderSuccess=
async(req,res)=>{
  try{
    const {orderId}=req.params;
   const order=await Order.findOne({orderId}).populate("address").populate("items.product");
    if(!order){
      return res.status(404).send("Order not found");
    }
    res.render("user/order-success",{order});
  }catch(error){
    console.error(error);
    res.status(500).send("Internal server error");
  }
}
export const renderMyOrders = async (req, res) => {
    try {

        if (!req.session.user) {
            return res.redirect("/login");
        }

        const userId = req.session.user.id;

        const orders = await Order.find({ user: userId })
            .populate("address")
            .sort({ createdAt: -1 });

        res.render("user/my-orders", { orders });

    } catch (error) {
        console.log(error);
        res.status(500).send("Server Error");
    }
};


export const renderOrderDetails=
async(req,res)=>{

    const order=
    await Order.findOne({
        orderId:req.params.orderId
    }).populate("items.product");

    res.render(
        "user/order-details",
        {order}
    );
}
export const renderCancelPage = async (req, res) => {
    try {

        if (!req.session.user) {
            return res.redirect("/login");
        }

        const order = await Order.findOne({
            orderId: req.params.orderId,
            user: req.session.user.id
        }).populate("items.product");

        if (!order) {
            return res.status(404).send("Order not found");
        }

        res.render("user/cancel-order", { order });

    } catch (error) {
        console.log(error);
        res.status(500).send("Server Error");
    }
};
export const renderReturnPage = async (req, res) => {
    try {

        if (!req.session.user) {
            return res.redirect("/login");
        }

        const order = await Order.findOne({
            orderId: req.params.orderId,
            user: req.session.user.id
        }).populate("items.product");

        if (!order) {
            return res.status(404).send("Order not found");
        }

        res.render("user/return-order", { order });

    } catch (error) {
        console.log(error);
        res.status(500).send("Server Error");
    }
};
export const cancelOrder = async (req, res) => {
    try {

        const order = await Order.findOne({
            orderId: req.params.orderId,
            user: req.session.user.id
        });

        if (!order) {
            return res.status(404).send("Order not found");
        }

        if (
            order.status === "DELIVERED" ||
            order.status === "CANCELLED"
        ) {
            return res.send(
                "This order cannot be cancelled."
            );
        }

        order.status = "CANCELLED";

        order.cancellationReason =
            req.body.reason || null;

        for (const item of order.items) {

            const product = await Product.findById(
                item.product
            );

            const variant = product.variants.find(
                v =>
                    v.size === item.size &&
                    v.color === item.color
            );

            if (variant) {
                variant.stock += item.quantity;
            }

            await product.save();
        }

        await order.save();

        res.redirect("/api/orders/my-orders");

    } catch (error) {
        console.log(error);
        res.status(500).send("Server Error");
    }
};
export const returnOrder = async (req, res) => {
    try {

        const order = await Order.findOne({
            orderId: req.params.orderId,
            user: req.session.user.id
        });

        if (!order) {
            return res.status(404).send("Order not found");
        }

        if (order.status !== "DELIVERED") {
            return res.send(
                "Only delivered orders can be returned."
            );
        }

        if (!req.body.reason) {
            return res.status(400).send(
                "Return reason is required."
            );
        }

        order.status = "RETURNED";

        order.returnReason = req.body.reason;

        await order.save();

        res.redirect("/api/orders/my-orders");

    } catch (error) {
        console.log(error);
        res.status(500).send("Server Error");
    }
};

export const downloadInvoice = async (req, res) => {
    try {
        console.log(req.session.user);
        if (!req.session.user) {
            return res.redirect("/login");
        }

        const order = await Order.findOne({
            orderId: req.params.orderId,
            user: req.session.user.id
        })
        .populate("user")
        .populate("address")
        .populate("items.product");
       
       
       
       
     if (!order) {
            return res.status(404).send(
                "Order not found"
            );
        }

        const doc = new PDFDocument();

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename=${order.orderId}.pdf`
        );

        doc.pipe(res);

        doc.fontSize(20)
            .text("Alder & Ash.", {
                align: "center"
            });

        doc.moveDown();

        doc.fontSize(14)
            .text(`Invoice: ${order.orderId}`);

        doc.text(
            `Date: ${order.createdAt.toDateString()}`
        );

        doc.text(
            `Customer: ${
                order.user?.firstName || "Unknown"
            } ${
                order.user?.lastName || ""
            }`
        );
        
        order.items.forEach(item => {
        
            doc.text(
                `${
                    item.product?.productName ||
                    "Deleted Product"
                } x ${item.quantity}`
            );
        
            doc.text(`₹${item.price}`);
        
            doc.moveDown();
        });
        doc.text(
            `Subtotal: ₹${order.subtotal}`
        );

        doc.text(
            `Shipping: ₹${order.shipping}`
        );

        doc.text(
            `Grand Total: ₹${order.grandTotal}`
        );

        doc.moveDown();

        doc.text(
            `Payment Method: ${order.paymentMethod}`
        );

        doc.text(
            `Status: ${order.status}`
        );

        doc.end();

    } catch (error) {

        console.log(error);

        res.status(500).send(
            "Server Error"
        );
    }
};
export const renderAdminOrders = async (req, res) => {
    try {

        const search = req.query.search || "";
        const status = req.query.status || "";
        const sort = req.query.sort || "latest";
        const page = Number(req.query.page) || 1;
        const limit = 5;
        
        let query = {};
        
        if (search) {
            query.orderId = {
                $regex: search,
                $options: "i"
            };
        }
        
        if (status) {
            query.status = status;
        }
        let sortOption = { createdAt: -1 };

        if (sort === "oldest") {
        sortOption = { createdAt: 1 };
}
        const orders = await Order.find(query)
        .populate("user")
        .populate("items.product")
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit);

        const totalOrders = await Order.countDocuments(query);

            const totalPages = Math.ceil(
                totalOrders / limit
            );
            const deliveredCount = await Order.countDocuments({
                status: "DELIVERED"
            });
            
            const placedCount = await Order.countDocuments({
                status: "PLACED"
            });
            
            const revenueData = await Order.aggregate([
                {
                    $match: {
                        status: "DELIVERED"
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: "$grandTotal"
                        }
                    }
                }
            ]);
            
            const revenue = revenueData[0]?.total || 0;
            

            res.render("admin/orders", {
                orders,
                search,
                status,
                sort,
                currentPage: page,
                totalPages,
                totalOrders,
                deliveredCount,
                placedCount,
                revenue
            });

    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};
export const updateOrderStatus = async (req, res) => {

    const { orderId } = req.params;
    const { status } = req.body;

    await Order.findOneAndUpdate(
        { orderId },
        { status }
    );

    res.redirect(
        "/api/orders/admin/orders"
    );
};
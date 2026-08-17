import Product from "../models/productModel.js";
import sharp from "sharp";
import Brand from "../models/brandModel.js";
import Category from "../models/categoryModel.js";
import Offer from "../models/offerModel.js";

function validateImageFiles(files) {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];
  for (const file of files) {
    if (!allowedTypes.includes(file.mimetype)) {
      return "Only JPEG, PNG, and WEBP images are allowed";
    }
    if (file.size > 2 * 1024 * 1024) {
      return "Each image must be less than 2MB";
    }
  }
  return null;
}
function validateVariants(variants) {
  if(!variants||variants.length === 0) {
    return "At least one variant is required";
  }
  for (const variant of variants) {
    const price= Number(variant.price);
    const stock= Number(variant.stock);
    if(!variant.size || !variant.color) {
      return "Each variant must have size and color";
    }
    if (isNaN(price) || price <= 0) {
      return "Variant price must be a positive number";
    }
    if (isNaN(stock) || stock < 0) {
      return "Variant stock must be a positive number";
    }
    variant.price = price;
    variant.stock = stock;
  }
  return null;
}
async function getBestOffer(product) {
  const now = new Date();

  const offers = await Offer.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { type: "PRODUCT", product: product._id },
      { type: "CATEGORY", category: product.category }
    ]
  });

  if (!offers.length) {
    return null;
  }

  let bestOffer = null;
  let bestDiscount = 0;

  const basePrice = Math.min(
    ...product.variants.map(v => v.price)
  );

  for (const offer of offers) {

    let discount = 0;

    if (offer.discountType === "PERCENTAGE") {
      discount =
        basePrice * offer.discountValue / 100;
    } else {
      discount =
        offer.discountValue;
    }

    // Don't allow discount greater than product price
    discount = Math.min(discount, basePrice);

    if (discount > bestDiscount) {
      bestDiscount = discount;
      bestOffer = offer;
    }
  }

  if (!bestOffer) {
    return null;
  }

  const offerPrice =
    Math.round((basePrice - bestDiscount) * 100) / 100;

  return {
    _id: bestOffer._id,
    name: bestOffer.name,
    type: bestOffer.type,
    discountType: bestOffer.discountType,
    discountValue: bestOffer.discountValue,

    originalPrice: basePrice,
    discountAmount: Math.round(bestDiscount * 100) / 100,
    offerPrice
  };
}


export const addProduct = async (req, res) => {

  try {

    const {
      productName,
      description,
      category,
      brand,
      variants
    } = req.body;
    const parsedVariants =
      JSON.parse(variants);

      const variantError =
      validateVariants(parsedVariants);

    if (variantError) {

      return res.status(400).json({
        message: variantError
      });
    }


    if (
      !req.files ||
      req.files.length < 3
    ) {

      return res.status(400).json({
        message:
          "Upload at least 3 images"
      });

    }
    const imageError =
      validateImageFiles(req.files);
    if (imageError) {

      return res.status(400).json({
        message: imageError
      });
    }


    const existingProduct =
      await Product.findOne({
        productName,
        isDeleted: false
      });

    if (existingProduct) {

      return res.status(400).json({
        message: "Product already exists"
      });

    }

  

    const resizedImages = [];

    for (const file of req.files) {

      const resizedFilename =
        `resized-${file.filename}`;

      await sharp(file.path)

        .resize(800, 800)

        .jpeg({ quality: 80 })

        .toFile(
          `uploads/${resizedFilename}`
        );

        resizedImages.push(
          `/uploads/${resizedFilename}`
        );

    };

    const product =
      new Product({

        productName,

        description,

        category,

        brand,

        variants:parsedVariants,

        images: resizedImages

      });

    await product.save();

    res.status(201).json({

      message:
        "Product added successfully",

      product

    });

  } catch (error) {

    console.log(
      "ADD PRODUCT ERROR:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });

  }

};
export const getProducts = async (req, res) => {

  try {

    const search =
      req.query.search || "";
      const fromDate=
      req.query.fromDate;
      const toDate=
      req.query.toDate;
    const category =
      req.query.category || "";
      const brand =
      req.query.brand || "";
      const sort =
      req.query.sort || ""; 
      const minPrice =
      req.query.minPrice || "";
      const maxPrice =
      req.query.maxPrice || "";

    const page =
      Number(req.query.page) || 1;

    const limit = 6;

    const skip =
      (page - 1) * limit;

      const activeBrands=
      await Brand.find({
        isBlocked:false,
        isDeleted:false
      }).select("_id");

      const activeBrandIds=activeBrands.map((brand)=>brand._id)

      const activeCategories=
      await Category.find({
        isListed:true,
        isDeleted:false
      }).select("_id");

      const activeCategoryIds=activeCategories.map((category)=>category._id )



      const query = {
        isDeleted:false,
        brand:{
          $in:activeBrandIds
        },
        category:{
          $in:activeCategoryIds
        },
        productName:{
          $regex:search,
          $options:"i"
        }
      
      };
    
    

      if(fromDate||toDate){
        query.createdAt={};
        if(fromDate){
          query.createdAt.$gte=
          new Date(fromDate);
        }
        if(toDate){
          const endDate=
          new Date(toDate);

          endDate.setHours(23,59,59,999);

          query.createdAt.$lte=endDate;
        }






      }
      
      if (category) {
        query.category = category;

      
      }
      if (brand) {

        if (
          !activeBrandIds
            .map((id) => id.toString())
            .includes(brand)
        ) {
      
          return res.status(200).json({
            products: [],
            currentPage: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false
          });
      
        }
      
        query.brand = brand;
      
      }



      if (minPrice || maxPrice) {
        query["variants.price"] = {};
        if (minPrice) {
          query["variants.price"].$gte = Number(minPrice);
        }
        if (maxPrice) {
          query["variants.price"].$lte = Number(maxPrice);
        }
      };

    const totalProducts =
      await Product.countDocuments(query);

    const products =
      await Product.find(query)

        .populate("category")
        .populate("brand")

        .sort(

          sort === "priceLowHigh"
        
            ? { "variants.price": 1 }
        
            : sort === "priceHighLow"
        
            ? { "variants.price": -1 }
        
            : sort === "az"
        
            ? { productName: 1 }
        
            : sort === "za"
        
            ? { productName: -1 }
        
            : { createdAt: -1 }
        
        )

        .skip(skip)

        .limit(limit);

    res.status(200).json({

      products,

      currentPage: page,

      totalPages: Math.ceil(
        totalProducts / limit
      ),

      hasNextPage:
        page * limit < totalProducts,

      hasPrevPage:
        page > 1

    });

  } catch (error) {

    console.log(
      "GET PRODUCTS ERROR:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });

  }

};
export const getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate("category")
      .populate("brand");

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    // GET BEST OFFER
    const offer = await getBestOffer(product);

    res.status(200).json({
      product,
      offer
    });

  } catch (error) {
    console.log(
      "GET SINGLE PRODUCT ERROR:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};
export const updateProduct = async (req, res) => {

  try {

    const { id } = req.params;

    const {
      productName,
      description,
      category,
      brand,
      variants
    } = req.body;

    const parsedVariants =
      JSON.parse(variants);

      const variantError =
      validateVariants(parsedVariants);

    if (variantError) {
      return res.status(400).json({
        message: variantError
      });
     }

    let existingImages = [];

    if (req.body.existingImages) {

      existingImages =
        JSON.parse(req.body.existingImages);

    }

    let newImages = [];

    if (
      req.files &&
      req.files.length > 0
    ) {

      const imageError =
        validateImageFiles(req.files);
      if (imageError) {
        return res.status(400).json({
          message: imageError
        });
       }


      for (const file of req.files) {

        const resizedFilename =
          `resized-${file.filename}`;

        await sharp(file.path)

          .resize(800, 800)

          .jpeg({ quality: 80 })

          .toFile(
            `uploads/${resizedFilename}`
          );

        newImages.push(
          `/uploads/${resizedFilename}`
        );

      }

    }

    const updatedProduct =
      await Product.findByIdAndUpdate(

        id,

        {
          productName,
          description,
          category,
          brand,

          variants: parsedVariants,

          images: [
            ...existingImages,
            ...newImages
          ]

        },

        {
          returnDocument: "after"
        }

      );

    res.status(200).json({

      message:
        "Product updated successfully",

      updatedProduct

    });

  } catch (error) {

    console.log(
      "UPDATE PRODUCT ERROR:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });

  }

};
export const deleteProduct = async (req, res) => {

  try {

    const { id } = req.params;

    await Product.findByIdAndUpdate(

      id,

      {
        isDeleted: true
      }

    );

    res.status(200).json({
      message:
        "Product deleted successfully"
    });

  } catch (error) {

    console.log(
      "DELETE PRODUCT ERROR:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });

  }

};

export const toggleProductStatus = async (req, res) => {

  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }
    product.isListed = !product.isListed;
    await product.save();
    res.status(200).json({
      message: product.isListed
        ? "Product activated"
        : "Product deactivated",
      product
    });
  } catch (error) {
    console.log(
      "TOGGLE PRODUCT STATUS ERROR:",
      error.message
    );
    res.status(500).json({
      message: "Server error"
    });
  }
};
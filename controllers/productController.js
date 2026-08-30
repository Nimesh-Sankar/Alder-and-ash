import Product from "../models/productModel.js";
import sharp from "sharp";
import cloudinary from "../config/cloudinary.js";
import Brand from "../models/brandModel.js";
import Category from "../models/categoryModel.js";
import Offer from "../models/offerModel.js";
import STATUS_CODES from "../constants/statusCodes.js";

const uploadProductImage = async (file) => {
  const processedImage = await sharp(file.buffer)
    .resize(800, 800, {
      fit: "inside",
      withoutEnlargement: true
    })
    .jpeg({ quality: 80 })
    .toBuffer();


  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "alder-and-ash/products",
        resource_type: "image"
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result.secure_url);
      }
    );

    uploadStream.end(processedImage);
  });
};

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

  if (!variants || variants.length === 0) {
      return "At least one variant is required";
  }

  const uniqueVariants = new Set();

  for (const variant of variants) {

      const price = Number(variant.price);
      const stock = Number(variant.stock);

      if (!variant.size || !variant.color) {
          return "Each variant must have size and color";
      }

      
      const key =
          `${variant.size.trim().toLowerCase()}-${variant.color.trim().toLowerCase()}`;

      if (uniqueVariants.has(key)) {
          return `${variant.size} - ${variant.color} variant already exists`;
      }

      uniqueVariants.add(key);

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

      return res.status(STATUS_CODES.BAD_REQUEST).json({
        message: variantError
      });
    }


    if (
      !req.files ||
      req.files.length < 3
    ) {

      return res.status(STATUS_CODES.BAD_REQUEST).json({
        message:
          "Upload at least 3 images"
      });

    }
    const imageError =
      validateImageFiles(req.files);
    if (imageError) {

      return res.status(STATUS_CODES.BAD_REQUEST).json({
        message: imageError
      });
    }


    const existingProduct =
      await Product.findOne({
        productName,
        isDeleted: false
      });

    if (existingProduct) {

      return res.status(STATUS_CODES.BAD_REQUEST).json({
        message: "Product already exists"
      });

    }

  

    const resizedImages = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const imageUrl = await uploadProductImage(file);
        resizedImages.push(imageUrl);
      }
    }

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

    res.status(STATUS_CODES.CREATED).json({

      message:
        "Product added successfully",

      product

    });

  }catch (error) {
    console.error("ADD PRODUCT ERROR:", error);
  
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: error?.message || "Server error"
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

    const limit = 4;

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
      if (req.query.onlyListed === "true") {
        query.isListed = true;
      }
    
    

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
      
          return res.status(STATUS_CODES.OK).json({
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

        res.status(STATUS_CODES.OK).json({

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

    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
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
      return res.status(STATUS_CODES.NOT_FOUND).json({
        message: "Product not found"
      });
    }

    // GET BEST OFFER
    const offer = await getBestOffer(product);

    res.status(STATUS_CODES.OK).json({
      product,
      offer
    });

  } catch (error) {
    console.log(
      "GET SINGLE PRODUCT ERROR:",
      error.message
    );

    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
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

    // Find current product first
    const currentProduct =
      await Product.findById(id);

    if (!currentProduct) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        message: "Product not found"
      });
    }

    const parsedVariants =
      JSON.parse(variants);

    const variantError =
      validateVariants(parsedVariants);

    if (variantError) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        message: variantError
      });
    }

    
    let existingImages =
      currentProduct.images || [];


    if (req.body.existingImages) {
      try {
        existingImages =
          JSON.parse(
            req.body.existingImages
          );
      } catch  {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
          message:
            "Invalid existing images data"
        });
      }
    }

    const newImages = [];

    // Upload newly selected images
    if (
      req.files &&
      req.files.length > 0
    ) {
      const imageError =
        validateImageFiles(req.files);

      if (imageError) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
          message: imageError
        });
      }

      for (const file of req.files) {
        const imageUrl =
          await uploadProductImage(file);

        newImages.push(imageUrl);
      }
    }

    const finalImages = [
      ...existingImages,
      ...newImages
    ];

    const updatedProduct =
      await Product.findByIdAndUpdate(
        id,
        {
          productName,
          description,
          category,
          brand,
          variants: parsedVariants,
          images: finalImages
        },
        {
          new: true
        }
      );

    return res.status(STATUS_CODES.OK).json({
      message:
        "Product updated successfully",
      updatedProduct
    });

  } catch (error) {
    console.error(
      "UPDATE PRODUCT ERROR:",
      error
    );

    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message:
        error?.message ||
        "Server error"
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

    res.status(STATUS_CODES.OK).json({
      message:
        "Product deleted successfully"
    });

  } catch (error) {

    console.log(
      "DELETE PRODUCT ERROR:",
      error.message
    );

    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: "Server error"
    });

  }

};

export const toggleProductStatus = async (req, res) => {

  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        message: "Product not found"
      });
    }
    product.isListed = !product.isListed;
    await product.save();
    res.status(STATUS_CODES.OK).json({
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
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: "Server error"
    });
  }
};
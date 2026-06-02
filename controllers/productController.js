import e from "express";
import Product from "../models/productModel.js";
import sharp from "sharp";

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

    const limit = 5;

    const skip =
      (page - 1) * limit;

      const query = {

        isDeleted: false,
        
      
        productName: {
          $regex: search,
          $options: "i"
        }
      
      };
      
      if (category) {
        query.category = category;

      
      }
        if (brand) {  
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

    const product =
      await Product.findById(id)

        .populate("category")
        .populate("brand");

    if (!product) {

      return res.status(404).json({
        message: "Product not found"
      });

    }

    res.status(200).json({
      product
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
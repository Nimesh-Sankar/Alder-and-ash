import Brand from "../models/brandModel.js";


// =========================
// ADD BRAND
// =========================
export const addBrand = async (req, res) => {

  try {

    const { brandName, description } = req.body;

    const existingBrand = await Brand.findOne({
      brandName: brandName.trim(),
      isDeleted: false
    });

    if (existingBrand) {

      return res.status(400).json({
        message: "Brand already exists"
      });

    }

    const brand = new Brand({
      brandName,
      description
    });

    await brand.save();

    res.status(201).json({
      message: "Brand added successfully",
      brand
    });

  } catch (error) {

    console.log(
      "ADD BRAND ERROR:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });

  }

};


// =========================
// GET BRANDS
// =========================
export const getBrands = async (req, res) => {

  try {

    const search = req.query.search || "";

    const page = Number(req.query.page) || 1;

    const limit = 5;

    const skip = (page - 1) * limit;

    const query = {

      isDeleted: false,

      brandName: {
        $regex: search,
        $options: "i"
      }

    };

    const totalBrands =
      await Brand.countDocuments(query);

    const brands =
      await Brand.find(query)

        .sort({ createdAt: -1 })

        .skip(skip)

        .limit(limit);

    res.status(200).json({

      brands,

      currentPage: page,

      totalPages: Math.ceil(
        totalBrands / limit
      ),

      hasNextPage:
        page * limit < totalBrands,

      hasPrevPage:
        page > 1

    });

  } catch (error) {

    console.log(
      "GET BRAND ERROR:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });

  }

};


// =========================
// UPDATE BRAND
// =========================
export const updateBrand = async (req, res) => {

  try {

    const updatedBrand =
      await Brand.findByIdAndUpdate(

        req.params.id,

        req.body,

        {
          new: true
        }

      );

    if (!updatedBrand) {

      return res.status(404).json({
        message: "Brand not found"
      });

    }

    res.json({
      message: "Brand updated successfully",
      brand: updatedBrand
    });

  } catch (error) {

    console.log(
      "UPDATE BRAND ERROR:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });

  }

};


// =========================
// DELETE BRAND
// =========================
export const deleteBrand = async (req, res) => {

  try {

    const deletedBrand =
      await Brand.findByIdAndUpdate(

        req.params.id,

        {
          isDeleted: true
        },

        {
          returnDocument: "after"
        }

      );

    if (!deletedBrand) {

      return res.status(404).json({
        message: "Brand not found"
      });

    }

    res.json({
      message: "Brand deleted successfully"
    });

  } catch (error) {

    console.log(
      "DELETE BRAND ERROR:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });

  }

};
// =========================
// BLOCK / UNBLOCK BRAND
// =========================
export const toggleBrandStatus = async (req, res) => {

  try {

    const brand = await Brand.findById(
      req.params.brandId
    );

    if (!brand) {

      return res.status(404).json({
        message: "Brand not found"
      });

    }

    brand.isBlocked = !brand.isBlocked;

    await brand.save();

    res.json({
      message: brand.isBlocked
        ? "Brand blocked"
        : "Brand unblocked",
      brand
    });

  } catch (error) {

    console.log(
      "TOGGLE BRAND ERROR:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });

  }

};
import Category from "../models/categoryModel.js";
import STATUS_CODES from "../constants/statusCodes.js";

export const addCategory = async (req, res) => {

  try {

    const { name, description } = req.body;

    const trimmedName = name.trim();

    const existingCategory =
      await Category.findOne({
        name: {
          $regex: `^${trimmedName}$`,
          $options: "i"
        },
        isDeleted: false
      });

    if (existingCategory) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        message: "Category already exists"
      });
    }

    const category = new Category({
      name: trimmedName,
      description
    });

    await category.save();

    res.status(STATUS_CODES.CREATED).json({
      message: "Category added successfully",
      category
    });

  } catch (error) {

    console.log(
      "ADD CATEGORY ERROR:",
      error.message
    );

    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: "Server error"
    });

  }

};



// UPDATE CATEGORY
export const updateCategory = async (req, res) => {

  try {

    const { name, description } = req.body;

    const { id } = req.params;

    const trimmedName = name.trim();

    const existingCategory =
      await Category.findOne({
        name: {
          $regex: `^${trimmedName}$`,
          $options: "i"
        },
        _id: {
          $ne: id
        },
        isDeleted: false
      });

    if (existingCategory) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        message: "Category already exists"
      });
    }

    const updatedCategory =
      await Category.findByIdAndUpdate(
        id,
        {
          name: trimmedName,
          description
        },
        {
          returnDocument: "after",
          runValidators: true
        }
      );

    if (!updatedCategory) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        message: "Category not found"
      });
    }

    res.json({
      message: "Category updated successfully",
      category: updatedCategory
    });

  } catch (error) {

    console.log(
      "UPDATE CATEGORY ERROR:",
      error.message
    );

    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: "Server error"
    });

  }

};
export const getCategories = async (req, res) => {

  try {

    const search = req.query.search || "";

    const page = Number(req.query.page) || 1;

    const limit = 6;

    const skip = (page - 1) * limit;

    const query = {
      isDeleted: false,
      name: {
        $regex: search,
        $options: "i"
      }
    };

    const totalCategories =
      await Category.countDocuments(query);

    const categories =
      await Category.find(query)

        .sort({ createdAt: -1 })

        .skip(skip)

        .limit(limit);

    res.status(STATUS_CODES.OK).json({

      categories,

      currentPage: page,

      totalPages: Math.ceil(
        totalCategories / limit
      ),

      hasNextPage:
        page * limit < totalCategories,

      hasPrevPage:
        page > 1

    });

  } catch (error) {

    console.log(
      "GET CATEGORY ERROR:",
      error.message
    );

    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: "Server error"
    });

  }

};

// SOFT DELETE CATEGORY
export const deleteCategory = async (req, res) => {

  try {

    const deletedCategory =
      await Category.findByIdAndUpdate(

        req.params.id,

        {
          isDeleted: true
        },

        {
          returnDocument: "after"
        }

      );

    if (!deletedCategory) {

      return res.status(STATUS_CODES.NOT_FOUND).json({
        message: "Category not found"
      });

    }

    res.json({
      message: "Category deleted successfully"
    });

  } catch (error) {

    console.log(
      "DELETE CATEGORY ERROR:",
      error.message
    );

    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: "Server error"
    });

  }

};
export const toggleCategoryStatus = async (req, res) => {

  try {

    const { categoryId } = req.params;

    const category =
      await Category.findById(categoryId);

    if (!category) {

      return res.status(STATUS_CODES.NOT_FOUND).json({
        message: "Category not found"
      });

    }

    category.isListed =
      !category.isListed;

    await category.save();

    res.status(STATUS_CODES.OK).json({
      message: category.isListed
        ? "Category activated"
        : "Category blocked",
      category
    });

  } catch (error) {

    console.log(
      "CATEGORY STATUS ERROR:",
      error.message
    );

    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      message: "Server error"
    });

  }

};

import Banner from "../models/bannerModel.js";
import cloudinary from "../config/cloudinary.js";
import STATUS_CODES from "../constants/statusCodes.js";

const uploadBannerImage = async (file) => {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "alder-and-ash/banners",
          resource_type: "image"
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
  
          resolve(result.secure_url);
        }
      );
  
      uploadStream.end(file.buffer);
    });
  };

  export const createBanner = async (req, res) => {
    try {
      const {
        title,
        subtitle,
        buttonText
      } = req.body;
  
      if (!title) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
          success: false,
          message: "Banner title is required"
        });
      }
  
      if (!req.file) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
          success: false,
          message: "Banner image is required"
        });
      }
  
      // Upload image to Cloudinary
      const imageUrl =
        await uploadBannerImage(req.file);
  
      const banner = await Banner.create({
        title,
        subtitle: subtitle || "",
        image: imageUrl,
        buttonText: buttonText || "Explore Now",
        isActive: true
      });
  
      return res.status(STATUS_CODES.CREATED).json({
        success: true,
        message: "Banner created successfully",
        banner
      });
  
    } catch (error) {
      console.log(
        "CREATE BANNER ERROR:",
        error
      );
  
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Server error"
      });
    }
  };

export const getBanners = async (req, res) => {
    try {

        const banners = await Banner.find()
            .sort({ createdAt: -1 });

        return res.status(STATUS_CODES.OK).json({
            success: true,
            banners
        });

    } catch (error) {

        console.log(
            "GET BANNERS ERROR:",
            error
        );

        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Server error"
        });
    }
};


export const getActiveBanner = async (req, res) => {
    try {

        const banner = await Banner.findOne({
            isActive: true
        })
        .sort({ createdAt: -1 });

        return res.status(STATUS_CODES.OK).json({
            success: true,
            banner
        });

    } catch (error) {

        console.log(
            "GET ACTIVE BANNER ERROR:",
            error
        );

        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Server error"
        });
    }
};


export const toggleBannerStatus = async (req, res) => {
    try {

        const banner = await Banner.findById(
            req.params.id
        );

        if (!banner) {
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success: false,
                message: "Banner not found"
            });
        }

        banner.isActive =
            !banner.isActive;

        await banner.save();

        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: "Banner status updated",
            banner
        });

    } catch (error) {

        console.log(
            "TOGGLE BANNER ERROR:",
            error
        );

        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Server error"
        });
    }
};
export const updateBanner = async (req, res) => {
    try {
      const banner = await Banner.findById(
        req.params.id
      );
  
      if (!banner) {
        return res.status(STATUS_CODES.NOT_FOUND).json({
          success: false,
          message: "Banner not found"
        });
      }
  
      const {
        title,
        subtitle,
        buttonText
      } = req.body;
  
      if (!title) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({
          success: false,
          message: "Banner title is required"
        });
      }
  
      banner.title = title;
      banner.subtitle = subtitle || "";
      banner.buttonText =
        buttonText || "Explore Now";
  
      // Only upload a new image when admin selected one
      if (req.file) {
        const imageUrl =
          await uploadBannerImage(req.file);
  
        banner.image = imageUrl;
      }
  
      await banner.save();
  
      return res.status(STATUS_CODES.OK).json({
        success: true,
        message: "Banner updated successfully",
        banner
      });
  
    } catch (error) {
      console.log(
        "UPDATE BANNER ERROR:",
        error
      );
  
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Server error"
      });
    }
  };


export const deleteBanner = async (req, res) => {
    try {

        const banner = await Banner.findById(
            req.params.id
        );

        if (!banner) {
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success: false,
                message: "Banner not found"
            });
        }

        await Banner.findByIdAndDelete(
            req.params.id
        );

        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: "Banner deleted successfully"
        });

    } catch (error) {

        console.log(
            "DELETE BANNER ERROR:",
            error
        );

        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Server error"
        });
    }
};
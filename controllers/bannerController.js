import Banner from "../models/bannerModel.js";

export const createBanner = async (req, res) => {
  try {

      const {
          title,
          subtitle,
          buttonText
      } = req.body;

      if (!title) {
          return res.status(400).json({
              success: false,
              message: "Banner title is required"
          });
      }

      if (!req.file) {
          return res.status(400).json({
              success: false,
              message: "Banner image is required"
          });
      }

      const banner = await Banner.create({
          title,
          subtitle: subtitle || "",
          image: `/uploads/${req.file.filename}`,
          buttonText: buttonText || "Explore Now",
          isActive: true
      });

      return res.status(201).json({
          success: true,
          message: "Banner created successfully",
          banner
      });

  } catch (error) {

      console.log(
          "CREATE BANNER ERROR:",
          error
      );

      return res.status(500).json({
          success: false,
          message: "Server error"
      });
  }
};


export const getBanners = async (req, res) => {
    try {

        const banners = await Banner.find()
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            banners
        });

    } catch (error) {

        console.log(
            "GET BANNERS ERROR:",
            error
        );

        return res.status(500).json({
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

        return res.status(200).json({
            success: true,
            banner
        });

    } catch (error) {

        console.log(
            "GET ACTIVE BANNER ERROR:",
            error
        );

        return res.status(500).json({
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
            return res.status(404).json({
                success: false,
                message: "Banner not found"
            });
        }

        banner.isActive =
            !banner.isActive;

        await banner.save();

        return res.status(200).json({
            success: true,
            message: "Banner status updated",
            banner
        });

    } catch (error) {

        console.log(
            "TOGGLE BANNER ERROR:",
            error
        );

        return res.status(500).json({
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
          return res.status(404).json({
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
          return res.status(400).json({
              success: false,
              message: "Banner title is required"
          });
      }

      banner.title = title;

      banner.subtitle =
          subtitle || "";

      banner.buttonText =
          buttonText || "Explore Now";

      // Replace image only if admin selected a new one
      if (req.file) {
          banner.image =
              `/uploads/${req.file.filename}`;
      }

      await banner.save();

      return res.status(200).json({
          success: true,
          message: "Banner updated successfully",
          banner
      });

  } catch (error) {

      console.log(
          "UPDATE BANNER ERROR:",
          error
      );

      return res.status(500).json({
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
            return res.status(404).json({
                success: false,
                message: "Banner not found"
            });
        }

        await Banner.findByIdAndDelete(
            req.params.id
        );

        return res.status(200).json({
            success: true,
            message: "Banner deleted successfully"
        });

    } catch (error) {

        console.log(
            "DELETE BANNER ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};
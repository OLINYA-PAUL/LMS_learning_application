import { Request, Response, NextFunction } from "express";
import { catchAsyncErroMiddleWare } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/errorHandler";
import LayoutModel from "../models/layout.model";
import cloudinary from "cloudinary";
import { UserModel } from "../models/user.models";
import { title } from "process";

// Create layout
export const createLayout = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;
      const userId = req?.user?._id; // Ensure your middleware sets `req.user`

      // Fetch the authenticated user
      const user = await UserModel.findById(userId);

      // Check if the user exists and has the 'admin' role
      if (!user || user.role !== "admin") {
        return next(
          new ErrorHandler("You do not have permission to update layout", 403)
        );
      }

      const isTypeExsit = await LayoutModel.findOne({ type });

      if (isTypeExsit) next(new ErrorHandler(`${type} already exsit`, 400));

      // Handle 'banner' type
      if (type === "Banner") {
        const { image, title, subTitle } = req.body;

        const myCloud = await cloudinary.v2.uploader.upload(image, {
          folder: "Banner",
        });

        const banner = {
          image: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          },
          title,
          subTitle,
        };

        await LayoutModel.create({
          type: "Banner",
          banner,
        });
      }

      // Handle 'FAQ' type
      if (type === "FAQ") {
        const { faq } = req.body;

        const faqItems = faq.map((item: any) => ({
          question: item.question,
          answer: item.answer,
        }));

        await LayoutModel.create({
          type: "FAQ",
          faq: faqItems,
        });
      }

      // Handle 'categories' type
      if (type === "Categories") {
        const { categories } = req.body;
        console.log({ categories: categories });

        const categoriesItems = categories.map((item: any) => ({
          title: item.title,
        }));

        await LayoutModel.create({
          type: "Categories",
          categories: categoriesItems,
        });
      }

      res.status(200).json({
        success: true,
        message: "Layout created successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Update banner  layout info
export const editLayout = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;
      const userId = req?.user?._id; // Ensure your middleware sets `req.user`

      // Fetch the authenticated user
      const user = await UserModel.findById(userId);

      // Check if the user exists and has the 'admin' role
      if (!user || user.role !== "admin") {
        return next(
          new ErrorHandler("You do not have permission to edit layout", 403)
        );
      }

      // Handle 'banner' type
      // if (type === "Banner") {
      //   const { image, title, subTitle } = req.body;

      //   const bannerData = await LayoutModel.findOne({ type: "Banner" });

      //   if (bannerData)
      //     await cloudinary.v2.uploader.destroy(
      //       bannerData.banner.image.public_id,
      //       {
      //         resource_type: "image",
      //       }
      //     );

      //   const myCloud = await cloudinary.v2.uploader.upload(image, {
      //     folder: "layout",
      //   });

      //   const banner = {
      //     image: {
      //       public_id: myCloud.public_id,
      //       url: myCloud.secure_url,
      //     },
      //     title,
      //     subTitle,
      //   };

      //   await LayoutModel.findByIdAndUpdate(bannerData?._id, { banner });
      // }

      if (type === "Banner") {
        const { image, title, subTitle } = req.body;

        let bannerData = await LayoutModel.findOne({ type: "Banner" });

        if (bannerData?.banner?.image?.public_id) {
          await cloudinary.v2.uploader.destroy(
            bannerData.banner.image.public_id,
            {
              resource_type: "image",
            }
          );
        }

        let uploadedImage = null;
        if (!image.startsWith("https")) {
          uploadedImage = await cloudinary.v2.uploader.upload(image, {
            folder: "layout",
          });
        }

        const banner = {
          image: {
            public_id: uploadedImage
              ? uploadedImage.public_id
              : bannerData?.banner.image?.public_id,
            url: uploadedImage
              ? uploadedImage.secure_url
              : bannerData?.banner.image?.url,
          },
          title,
          subTitle,
        };

        if (bannerData) {
          await LayoutModel.findByIdAndUpdate(bannerData._id, { banner });
        } else {
          bannerData = new LayoutModel({ type: "Banner", banner });
          await bannerData.save();
        }
      }

      // Handle 'FAQ' type
      if (type === "FAQ") {
        const { faq } = req.body;

        const faqId = await LayoutModel.findOne({ type: "FAQ" });

        console.log("FAQ DATA", faqId);

        const faqItems = faq.map((item: any) => ({
          question: item.question,
          answer: item.answer,
        }));

        await LayoutModel.findByIdAndUpdate(faqId?._id, {
          type: "FAQ",
          faq: faqItems,
        });
      }

      // Handle 'categories' type
      if (type === "Categories") {
        let { categories } = req.body;
        console.log(categories, "categories");

        if (!Array.isArray(categories)) {
          return next(new ErrorHandler("Categories must be an array", 400));
        }

        let categoryId = await LayoutModel.findOne({ type: "Categories" });

        const categoriesItems = categories.map((item: any) => ({
          title: item.title,
        }));

        await LayoutModel.findByIdAndUpdate(categoryId?._id, {
          type: "Categories",
          categories: categoriesItems,
        });

        if (!categoryId) {
          categoryId = new LayoutModel({
            type: "Categories",
            categories: categoriesItems,
          });
          await categoryId.save();
        }
      }

      res.status(200).json({
        success: true,
        message: "Layout Updated Successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// get layout by type

export const getLayoutByType = catchAsyncErroMiddleWare(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const type = req.params.type.trim(); // Ensure there are no spaces

      const layout = await LayoutModel.findOne({ type });

      if (!layout) {
        return next(new ErrorHandler("Cannot find this layout", 404));
      }

      res.status(200).json({
        success: true,
        layout,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

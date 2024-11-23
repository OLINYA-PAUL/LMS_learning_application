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
      if (type === "Banner") {
        const { image, title, subTitle } = req.body;

        const bannerData: any = await LayoutModel.findOne({ type: "Banner" });

        if (bannerData)
          await cloudinary.v2.uploader.destroy(bannerData.image.public_Id, {
            resource_type: "image",
          });

        const myCloud = await cloudinary.v2.uploader.upload(image, {
          folder: "layout",
        });

        const banner = {
          image: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          },
          title,
          subTitle,
        };

        await LayoutModel.findByIdAndUpdate(bannerData._id, { banner });
      }

      // Handle 'FAQ' type
      if (type === "FAQ") {
        const { faq } = req.body;

        const faqId = await LayoutModel.findOne({ type: "FAQ" });

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
        const { categories } = req.body;
        const categoryId = await LayoutModel.findOne({ type: "Categories" });

        const categoriesItems = categories.map((item: any) => ({
          title: item.title,
        }));

        await LayoutModel.findByIdAndUpdate(categoryId?._id, {
          $set: {
            type: "Categories",
            categories: categoriesItems,
          },
        });
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
      const type = req.body?.type as string;
      const layout: any = await LayoutModel.find({ type });

      if (layout) return next(new ErrorHandler("cannot find this layout", 404));

      res.status(200).json({
        success: true,
        layout,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

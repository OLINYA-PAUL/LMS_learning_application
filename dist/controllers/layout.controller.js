"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLayoutByType = exports.editLayout = exports.createLayout = void 0;
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const layout_model_1 = __importDefault(require("../models/layout.model"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const user_models_1 = require("../models/user.models");
// Create layout
exports.createLayout = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    try {
        const { type } = req.body;
        const userId = req?.user?._id; // Ensure your middleware sets `req.user`
        // Fetch the authenticated user
        const user = await user_models_1.UserModel.findById(userId);
        // Check if the user exists and has the 'admin' role
        if (!user || user.role !== "admin") {
            return next(new errorHandler_1.default("You do not have permission to update layout", 403));
        }
        const isTypeExsit = await layout_model_1.default.findOne({ type });
        if (isTypeExsit)
            next(new errorHandler_1.default(`${type} already exsit`, 400));
        // Handle 'banner' type
        if (type === "Banner") {
            const { image, title, subTitle } = req.body;
            const myCloud = await cloudinary_1.default.v2.uploader.upload(image, {
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
            await layout_model_1.default.create({
                type: "Banner",
                banner,
            });
        }
        // Handle 'FAQ' type
        if (type === "FAQ") {
            const { faq } = req.body;
            const faqItems = faq.map((item) => ({
                question: item.question,
                answer: item.answer,
            }));
            await layout_model_1.default.create({
                type: "FAQ",
                faq: faqItems,
            });
        }
        // Handle 'categories' type
        if (type === "Categories") {
            const { categories } = req.body;
            console.log({ categories: categories });
            const categoriesItems = categories.map((item) => ({
                title: item.title,
            }));
            await layout_model_1.default.create({
                type: "Categories",
                categories: categoriesItems,
            });
        }
        res.status(200).json({
            success: true,
            message: "Layout created successfully",
        });
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 400));
    }
});
// Update banner  layout info
exports.editLayout = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    try {
        const { type } = req.body;
        const userId = req?.user?._id; // Ensure your middleware sets `req.user`
        // Fetch the authenticated user
        const user = await user_models_1.UserModel.findById(userId);
        // Check if the user exists and has the 'admin' role
        if (!user || user.role !== "admin") {
            return next(new errorHandler_1.default("You do not have permission to edit layout", 403));
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
            let bannerData = await layout_model_1.default.findOne({ type: "Banner" });
            if (bannerData?.banner?.image?.public_id) {
                await cloudinary_1.default.v2.uploader.destroy(bannerData.banner.image.public_id, {
                    resource_type: "image",
                });
            }
            let uploadedImage = null;
            if (!image.startsWith("https")) {
                uploadedImage = await cloudinary_1.default.v2.uploader.upload(image, {
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
                await layout_model_1.default.findByIdAndUpdate(bannerData._id, { banner });
            }
            else {
                bannerData = new layout_model_1.default({ type: "Banner", banner });
                await bannerData.save();
            }
        }
        // Handle 'FAQ' type
        if (type === "FAQ") {
            const { faq } = req.body;
            const faqId = await layout_model_1.default.findOne({ type: "FAQ" });
            console.log("FAQ DATA", faqId);
            const faqItems = faq.map((item) => ({
                question: item.question,
                answer: item.answer,
            }));
            await layout_model_1.default.findByIdAndUpdate(faqId?._id, {
                type: "FAQ",
                faq: faqItems,
            });
        }
        // Handle 'categories' type
        if (type === "Categories") {
            let { categories } = req.body;
            console.log(categories, "categories");
            if (!Array.isArray(categories)) {
                return next(new errorHandler_1.default("Categories must be an array", 400));
            }
            let categoryId = await layout_model_1.default.findOne({ type: "Categories" });
            const categoriesItems = categories.map((item) => ({
                title: item.title,
            }));
            await layout_model_1.default.findByIdAndUpdate(categoryId?._id, {
                type: "Categories",
                categories: categoriesItems,
            });
            if (!categoryId) {
                categoryId = new layout_model_1.default({
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
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 400));
    }
});
// get layout by type
exports.getLayoutByType = (0, catchAsyncErrors_1.catchAsyncErroMiddleWare)(async (req, res, next) => {
    try {
        const type = req.params.type.trim(); // Ensure there are no spaces
        const layout = await layout_model_1.default.findOne({ type });
        if (!layout) {
            return next(new errorHandler_1.default("Cannot find this layout", 404));
        }
        res.status(200).json({
            success: true,
            layout,
        });
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 400));
    }
});

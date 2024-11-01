require("dotenv").config();
import mongoose, { Model, Schema, Document } from "mongoose";

interface IComment extends Document {
  user: object;
  comment: string;
  commentReplies?: IComment[];
}
[];

export interface IReview extends Document {
  user: string;
  rating: number;
  comment: string;
  commentReplies: IComment[];
}
[];

interface ILinks extends Document {
  title: string;
  url: string;
}
[];

interface ICourseData extends Document {
  title: string;
  description: string;
  videoUrl: string;
  videoThumbnail: string;
  videoLength: Number;
  videoSection: string;
  videoPlayer: string;
  link: ILinks[];
  question: IComment[];
  suggestion: string;
}
[];

interface ICourse extends Document {
  name: string;
  description: string;
  price: string;
  estimatedPrice: string;
  thumbnails: string;
  tag: string;
  level: string;
  demoUrl: string;
  benefits: { title: string }[];
  prerequiste: string;
  reviews: IReview[];
  courseData: ICourseData[];
  rating?: number;
  purchased?: number;
}

const revieweSchema = new Schema<IReview>({
  user: Object,
  rating: {
    type: Number,
    default: 0,
  },
  comment: String,
  commentReplies: String,
});

const likSchema = new Schema<ILinks>({
  title: String,
  url: String,
});

const commentSchema = new Schema<IComment>({
  user: Object,
  comment: String,
  commentReplies: [Object],
});

const courseDataSchema = new Schema<ICourseData>({
  description: String,
  videoUrl: String,
  videoThumbnail: Object,
  videoLength: String,
  videoSection: String,
  videoPlayer: String,
  link: [likSchema],
  question: [commentSchema],
  suggestion: String,
});

const courseSchema = new Schema<ICourse>(
  {
    name: String,
    description: String,
    price: String,
    estimatedPrice: String,
    thumbnails: String,
    tag: String,
    level: String,
    demoUrl: String,
    benefits: [Object],
    prerequiste: String,
    reviews: [revieweSchema],
    courseData: [courseDataSchema],
    rating: Number,
    purchased: Number,
  },
  { timestamps: true }
);

export const CourseModel: Model<ICourse> = mongoose.model(
  "userSchema",
  courseSchema
);

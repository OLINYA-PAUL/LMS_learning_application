require("dotenv").config();
import mongoose, { Model, Schema, Document } from "mongoose";
import { Iuser } from "./user.models";

interface IComment extends Document {
  user: Iuser;
  question: string;
  questionReplies?: [IComment];
}
[];

export interface IReview extends Document {
  user: Iuser;
  ratings: number;
  comment: string;
  commentReplies?: IComment[];
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
  suggestions: string;
}
[];

interface ICourse extends Document {
  name: string;
  description: string;
  price: Number;
  estimatedPrice: Number;
  thumbnails: string;
  tag: string;
  level: string;
  demoUrl: string;
  benefits: { title: string }[];
  prerequiste: { title: string }[];
  reviews: IReview[];
  courseData: ICourseData[];
  ratings?: number;
  purchased?: number;
}

const revieweSchema = new Schema<IReview>({
  user: Object,
  ratings: {
    type: Number,
    default: 0,
  },
  comment: String,
  commentReplies: [Object],
});

const likSchema = new Schema<ILinks>({
  title: String,
  url: String,
});

const commentSchema = new Schema<IComment>({
  user: Object,
  question: String,
  questionReplies: [Object],
});

const courseDataSchema = new Schema<ICourseData>({
  description: String,
  videoUrl: String,
  videoLength: String,
  videoSection: String,
  videoPlayer: String,
  link: [likSchema],
  question: [commentSchema],
  suggestions: String,
});

const courseSchema = new Schema<ICourse>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    estimatedPrice: {
      type: Number,
      required: true,
    },
    thumbnails: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    tag: {
      type: String,
      require: true,
    },
    level: {
      type: String,
      require: true,
    },
    demoUrl: {
      type: String,
      require: true,
    },
    benefits: [{ title: String }],
    prerequiste: [{ title: String }],
    reviews: [revieweSchema],
    courseData: [courseDataSchema],
    ratings: {
      type: String,
      default: 0,
    },
    purchased: {
      type: String,
      default: 0,
    },
  },
  { timestamps: true }
);

export const CourseModel: Model<ICourse> = mongoose.model(
  "courseSchema",
  courseSchema
);

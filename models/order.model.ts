import mongoose, { Mongoose, Model, Schema, Document } from "mongoose";

export interface IOrder extends Document {
  courseId: string;
  userId: string;
  payment_info: Object;
}

const orderSchema = new Schema<IOrder>(
  {
    courseId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    payment_info: {
      type: Object,
    },
  },
  { timestamps: true }
);

export const OrderModel: Model<IOrder> = mongoose.model("Orders", orderSchema);

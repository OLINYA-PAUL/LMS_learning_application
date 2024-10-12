import mongoose from "mongoose";

export const connectDbUrl = async (url: string) => {
  try {
    return await mongoose.connect(url);
  } catch (error) {
    // Check if error is an instance of Error
    if (error instanceof Error) {
      console.log(error.message);
    } else {
      console.log("An unexpected error occurred:", error);
    }
  }
};

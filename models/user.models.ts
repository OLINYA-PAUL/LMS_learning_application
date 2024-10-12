import mongoose, { Model, Schema, Document } from "mongoose";
const { bcrypt } = require("bcryptjs");

const emailRegexValidation: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Iuser extends Document {
  name: string;
  email: string;
  password: string;
  avatar: {
    public_Id: string;
    url: string;
  };
  role: string;
  isVerified: boolean;
  courses: Array<{ courseId: string }>;
  comparePassWord: (password: string) => Promise<boolean>;
}

const userSchema: Schema<Iuser> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
    },
    email: {
      type: String,
      required: [true, "email is required"],
      validate: {
        validator: (value: string) => {
          return emailRegexValidation.test(value);
        },
        message: "Please enter a valid email",
      },
      unique: true,
    },
    password: {
      type: String,
      required: [true, "password is required"],
      unique: true,
      maxlength: 10,
      minlength: 6,
    },
    avatar: {
      public_Id: String,
      url: String,
    },
    role: {
      type: String,
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    courses: [
      {
        courseId: String,
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre<Iuser>("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10); // Hash the password
  }
  next(); // Proceed to the next middleware or save operation
});

//@ts-ignore
userSchema.method.compareUserPassword = async function (
  password: string
): Promise<boolean> {
  //@ts-ignore
  const comparePassword = await bcrypt.compare(password, this.password);

  if (comparePassword) {
    return true; // Return true if the password matches
  } else {
    throw new Error("Password does not match"); // Reject with an error if the password doesn't match
  }
};

const UserModel: Model<Iuser> = mongoose.model("userSchema", userSchema);
module.exports = { UserModel };

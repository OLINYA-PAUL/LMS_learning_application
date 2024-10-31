require("dotenv").config();
import mongoose, { Model, Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";
import JWT from "jsonwebtoken";

const emailRegexValidation: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface Iuser extends Document {
  name: string;
  email: string;
  password: string;
  authType: "local" | "social";
  avatar: {
    public_Id: string;
    url: string;
  };
  role: string;
  isVerified: boolean;
  courses: Array<{ courseId: string }>;
  CompareUserPassword: (password: string) => Promise<boolean>;
  SignAccessToken: () => string;
  SignRefreshToken: () => string;
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
      required: function (this: Iuser) {
        // Require password only if authType is 'local'
        return this.authType === "local";
      },
      select: false,
      unique: false,
      minlength: [
        6,
        "password must be atleast 6 characters you passde {VALUE}",
      ],
      authType: { type: String, required: true, enum: ["local", "social"] },
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

userSchema.methods.CompareUserPassword = async function (
  password: string
): Promise<boolean> {
  if (!(await bcrypt.compare(password, this.password))) {
    throw new Error("Password does not match");
  }

  return true;
};

// Sign acssess token

userSchema.methods.SignAccessToken = function () {
  return JWT.sign(
    { id: this._id },
    (process.env.ACCESS_TOKEN as string) || "",
    { expiresIn: "5m" }
  );
};

// Sign refress token

userSchema.methods.SignRefreshToken = function () {
  return JWT.sign(
    { id: this._id },
    (process.env.REFRESS_TOKEN as string) || "",
    { expiresIn: "5m" }
  );
};

export const UserModel: Model<Iuser> = mongoose.model("userSchema", userSchema);

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
require("dotenv").config();
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const emailRegexValidation = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const userSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, "name is required"],
    },
    email: {
        type: String,
        required: [true, "email is required"],
        validate: {
            validator: (value) => {
                return emailRegexValidation.test(value);
            },
            message: "Please enter a valid email",
        },
        unique: true,
    },
    password: {
        type: String,
        required: function () {
            // Require password only if authType is 'local'
            return this.authType === "local";
        },
        select: false,
        unique: false,
        minlength: [
            6,
            "password must be atleast 6 characters you passed {VALUE}",
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
            course_Id: String,
        },
    ],
}, { timestamps: true });
userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcryptjs_1.default.hash(this.password, 10); // Hash the password
    }
    next(); // Proceed to the next middleware or save operation
});
userSchema.methods.CompareUserPassword = async function (password) {
    if (!(await bcryptjs_1.default.compare(password, this.password))) {
        throw new Error("Password does not match");
    }
    return true;
};
// Sign acssess token
userSchema.methods.SignAccessToken = function () {
    return jsonwebtoken_1.default.sign({ id: this._id }, process.env.ACCESS_TOKEN || "", { expiresIn: "1h" });
};
// Sign refress token
userSchema.methods.SignRefreshToken = function () {
    return jsonwebtoken_1.default.sign({ id: this._id }, process.env.REFRESH_TOKEN || "", { expiresIn: "3d" });
};
exports.UserModel = mongoose_1.default.model("users", userSchema);

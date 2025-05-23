"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
require("dotenv").config();
const nodemailer_1 = __importDefault(require("nodemailer"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const sendEmail = async (options) => {
    const transporter = nodemailer_1.default.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"), // Correct port handling
        secure: true, // true for port 465, false for other ports
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD,
        },
        logger: true, // Enable logging
        debug: true, // Enable debug output
    });
    const { email, subject, template, data } = options;
    // Path to email template file
    const templatePath = path_1.default.join(__dirname, "../mails", template);
    // Render the template file with ejs
    const html = await ejs_1.default.renderFile(templatePath, data);
    const mailOptions = {
        from: process.env.SMTP_MAIL, // sender address
        to: email, // list of receivers
        subject: subject, // Subject line
        html, // html body
    };
    try {
        // Send the email
        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${email}`);
    }
    catch (error) {
        console.error(`Failed to send email: ${error.message}`);
        throw new Error(`Email could not be sent: ${error.message}`);
    }
};
exports.sendEmail = sendEmail;

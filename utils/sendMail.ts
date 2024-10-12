require("dotenv").config();
import nodeMailer, { Transporter } from "nodemailer";
import ejs from "ejs";
import path from "path";

interface EmailOptions {
  email: string;
  subject: string;
  template: string;
  data: { [key: string]: any };
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const transporter: Transporter = nodeMailer.createTransport({
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
  const templatePath = path.join(__dirname, "../mails", template);

  // Render the template file with ejs
  const html: string = await ejs.renderFile(templatePath, data);

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
  } catch (error: any) {
    console.error(`Failed to send email: ${error.message}`);
    throw new Error(`Email could not be sent: ${error.message}`);
  }
};

require("dotenv").config();
import nodeMailer, { Transporter } from "nodemailer";
import ejs from "ejs";
import path from "path";

interface emailOptions {
  email: string;
  subject: string;
  template: string;
  data: { [key: string]: any };
}

export const sendEmail = async (options: emailOptions): Promise<void> => {
  const transpoter: Transporter = nodeMailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // true for port 465, false for other ports
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  const { email, subject, template, data } = options;

  // path to email template files
  const templatePath = path.join(__dirname, "../mails", template);

  // path to render the filw with ejs
  const html: string = await ejs.renderFile(templatePath, data);

  const sendMailOptions = {
    from: process.env.SMTP_MAIL, // sender address
    to: email, // list of receivers
    subject: subject, // Subject line
    html, // html body
  };

  await transpoter.sendMail(sendMailOptions);
};

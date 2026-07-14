import nodemailer from "nodemailer";

let transporter = null;

const createEmailTransporter = async () => {
  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.verify();

  console.log("Gmail transporter is ready");

  return transporter;
};

const sendEmail = async ({
  to,
  subject,
  text,
  html,
}) => {
  const emailTransporter =
    await createEmailTransporter();

  const info = await emailTransporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });

  console.log("Email sent:", info.messageId);

  return {
    messageId: info.messageId,
  };
};

export { sendEmail };
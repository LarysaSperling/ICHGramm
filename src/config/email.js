import nodemailer from "nodemailer";

let transporter = null;
let testAccount = null;

const createEmailTransporter = async () => {
  if (transporter) {
    return transporter;
  }

  testAccount = await nodemailer.createTestAccount();

  transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  await transporter.verify();

  console.log("Ethereal email transporter is ready");
  console.log(`Ethereal username: ${testAccount.user}`);
  console.log(`Ethereal password: ${testAccount.pass}`);

  return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
  const emailTransporter = await createEmailTransporter();

  const info = await emailTransporter.sendMail({
    from: '"ICHGramm" <no-reply@ichgramm.test>',
    to,
    subject,
    text,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);

  console.log("Email sent:", info.messageId);
  console.log("Ethereal preview URL:", previewUrl);

  return {
    messageId: info.messageId,
    previewUrl,
  };
};

export { sendEmail };
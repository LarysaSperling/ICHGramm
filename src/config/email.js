import nodemailer from "nodemailer";

// Render's free tier blocks outgoing SMTP ports (25/465/587), so in
// production emails go through the Brevo HTTP API (BREVO_API_KEY).
// Without the key, nodemailer + SMTP is used, as before (local setup).

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const REQUEST_TIMEOUT_MS = 10_000;
const DEFAULT_SENDER_NAME = "ICHGramm";
const MAX_ERROR_DETAIL_LENGTH = 200;

// EMAIL_FROM: "Name <email>", "\"Name\" <email>" or just "email".
// The value itself is never put into an error message.
export const parseSender = (from) => {
  const value = typeof from === "string" ? from.trim() : "";

  const withName = value.match(
    /^"?([^"<]*?)"?\s*<\s*([^<>\s]+@[^<>\s]+)\s*>$/,
  );

  if (withName) {
    return {
      name: withName[1].trim() || DEFAULT_SENDER_NAME,
      email: withName[2],
    };
  }

  if (/^[^<>\s"]+@[^<>\s"]+$/.test(value)) {
    return {
      name: DEFAULT_SENDER_NAME,
      email: value,
    };
  }

  throw new Error("EMAIL_FROM is missing or invalid");
};

// --- Brevo HTTP API ---------------------------------------------------

// Error messages contain neither the API key nor the email itself
// (recipient, subject, body): the caller logs them as they are. The
// `cause` of a failed fetch holds no request headers or body either.
const sendViaBrevo = async ({ to, subject, text, html }) => {
  const sender = parseSender(process.env.EMAIL_FROM);

  let response;

  try {
    response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY.trim(),
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender,
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error?.name === "TimeoutError") {
      throw new Error(
        `Brevo API timeout after ${REQUEST_TIMEOUT_MS / 1000} s`,
        { cause: error },
      );
    }

    const reason =
      error?.cause?.code || error?.code || error?.name || "unknown";

    throw new Error(`Brevo API request failed: ${reason}`, {
      cause: error,
    });
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    // Empty or non-JSON body: only the status is reported.
  }

  if (!response.ok) {
    const code = typeof data?.code === "string" ? data.code : "";
    const detail =
      typeof data?.message === "string"
        ? data.message.slice(0, MAX_ERROR_DETAIL_LENGTH)
        : "";

    throw new Error(
      `Brevo API error ${response.status}` +
        (code ? ` (${code})` : "") +
        (detail ? `: ${detail}` : ""),
    );
  }

  console.log("Email sent via Brevo:", data?.messageId);

  return {
    messageId: data?.messageId,
  };
};

// --- SMTP (nodemailer) ------------------------------------------------

let transporter = null;

const getSmtpTransporter = async () => {
  if (transporter) {
    return transporter;
  }

  const newTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    // Defaults are up to 2 min; a reset request must not hang that long.
    connectionTimeout: REQUEST_TIMEOUT_MS,
    greetingTimeout: REQUEST_TIMEOUT_MS,
    socketTimeout: REQUEST_TIMEOUT_MS,
  });

  await newTransporter.verify();

  // Cached only after a successful verify, so a failed check is
  // repeated on the next email instead of reusing a broken transport.
  transporter = newTransporter;

  console.log("SMTP transporter is ready");

  return transporter;
};

const sendViaSmtp = async ({ to, subject, text, html }) => {
  const smtpTransporter = await getSmtpTransporter();

  const info = await smtpTransporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });

  console.log("Email sent via SMTP:", info.messageId);

  return {
    messageId: info.messageId,
  };
};

// ----------------------------------------------------------------------

const sendEmail = (message) =>
  process.env.BREVO_API_KEY?.trim()
    ? sendViaBrevo(message)
    : sendViaSmtp(message);

export { sendEmail };

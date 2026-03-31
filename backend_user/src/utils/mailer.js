function getMailConfig() {
  const user = process.env.MAIL_ALERT_EMAIL;
  const pass = process.env.MAIL_ALERT_APP_PASSWORD;

  if (!user || !pass) {
    const error = new Error(
      "Mail alert is not configured. Add MAIL_ALERT_EMAIL and MAIL_ALERT_APP_PASSWORD in backend_user/.env.",
    );
    error.statusCode = 500;
    throw error;
  }

  return {
    user,
    pass,
    fromName: process.env.MAIL_ALERT_FROM_NAME || "AYRA ERP Alerts",
  };
}

export async function sendAlertMail({ to, bcc, subject, html, text, replyTo }) {
  const { default: nodemailer } = await import("nodemailer");
  const { user, pass, fromName } = getMailConfig();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });

  return transporter.sendMail({
    from: `"${fromName}" <${user}>`,
    to,
    bcc,
    replyTo: replyTo || user,
    subject,
    text,
    html,
  });
}

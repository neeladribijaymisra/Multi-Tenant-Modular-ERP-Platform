import emailTransporter from '../config/emailTransporter.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(Number(amount || 0));

const formatDueDate = (dueDate) => {
  if (!dueDate) return null;

  const parsedDate = new Date(dueDate);
  if (Number.isNaN(parsedDate.getTime())) return dueDate;

  return parsedDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const sendFeeReminder = async (req, res) => {
  const { email, studentName, dueAmount, dueDate } = req.body;

  if (!email) {
    return sendError(res, 'Student email is required.', 400);
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('Fee reminder email configuration is missing. Set EMAIL_USER and EMAIL_PASS.');
    return sendError(res, 'Fee reminder email is currently unavailable.', 500);
  }

  const formattedDueDate = formatDueDate(dueDate);
  const formattedAmount = formatCurrency(dueAmount);
  const safeStudentName = studentName || 'Student';

  const html = `
    <div style="margin:0;padding:24px;background:#f8fafc;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;box-shadow:0 18px 45px rgba(15,23,42,0.08);">
        <div style="padding:28px 32px;background:linear-gradient(135deg,#0f172a 0%,#1d4ed8 100%);color:#ffffff;">
          <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;opacity:0.8;">AYRA ERP</div>
          <h1 style="margin:12px 0 8px;font-size:28px;line-height:1.2;">Fee Payment Reminder</h1>
          <p style="margin:0;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.84);">A reminder from the Accounts Section regarding your pending student fee payment.</p>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Dear ${safeStudentName},</p>
          <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#475569;">
            This is a friendly reminder that your pending fee payment is still due. Please review the details below and complete the payment at the earliest convenience to avoid any disruption.
          </p>
          <div style="padding:22px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0;">
            <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;margin-bottom:8px;">Pending Amount</div>
            <div style="font-size:30px;font-weight:800;color:#dc2626;line-height:1.1;">${formattedAmount}</div>
            ${formattedDueDate ? `
              <div style="margin-top:18px;padding-top:18px;border-top:1px solid #e2e8f0;">
                <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;margin-bottom:6px;">Due Date</div>
                <div style="font-size:16px;font-weight:700;color:#0f172a;">${formattedDueDate}</div>
              </div>
            ` : ''}
          </div>
          <p style="margin:22px 0 0;font-size:14px;line-height:1.7;color:#475569;">
            If you have already completed the payment, please disregard this email. For any clarification, feel free to contact the Accounts Section.
          </p>
          <p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#0f172a;">
            Regards,<br />
            <strong>Accounts Section</strong><br />
            AYRA ERP
          </p>
        </div>
      </div>
    </div>
  `;

  try {
    await emailTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Fee Payment Reminder',
      html,
    });

    return sendSuccess(res, {}, 'Fee reminder email sent successfully.');
  } catch (error) {
    console.error(`Failed to send fee reminder email to ${email}:`, error);
    return sendError(res, 'Failed to send fee reminder email.', 500);
  }
};

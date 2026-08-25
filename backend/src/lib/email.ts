import axios from 'axios';

const OWNER_EMAIL = 'kvirzi@gmail.com';
const FROM = 'StreamRotate <notifications@streamrotate.com>';

async function sendEmail(to: string, subject: string, html: string, replyTo?: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — skipping email');
    return;
  }
  try {
    await axios.post(
      'https://api.resend.com/emails',
      { from: FROM, to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) },
      { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Failed to send email:', err);
  }
}

export async function notifyNewSignup(userEmail: string) {
  await sendEmail(
    OWNER_EMAIL,
    '🎉 New StreamRotate signup!',
    `<h2>New user signed up</h2><p><strong>${userEmail}</strong> just created an account on StreamRotate.</p>`
  );
}

export async function notifyNewPayment(userEmail: string, plan: string, amount: string) {
  await sendEmail(
    OWNER_EMAIL,
    '💰 New StreamRotate subscription!',
    `<h2>New paying customer!</h2><p><strong>${userEmail}</strong> just subscribed to the <strong>${plan}</strong> plan (${amount}).</p>`
  );
}

export interface BillingReminderItem {
  name: string;
  cost_monthly: number;
  days: number;
  renewalLabel: string; // e.g. "Mon, Nov 3"
  cancel_url: string | null;
}

// The next service in the rotation to reactivate, with a few of its shows.
export interface NextUp {
  serviceName: string;
  signupUrl: string | null;
  shows: string[];
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ));
}

// User-facing email listing subscriptions renewing soon: each with its renewal
// (cancel-by) date and a one-tap cancel link, plus the next service in the
// rotation to reactivate, and a one-click unsubscribe link.
export async function sendBillingReminder(
  userEmail: string,
  items: BillingReminderItem[],
  nextUp: NextUp | null,
  unsubscribeUrl: string,
) {
  if (!items.length) return;
  const { subject, html } = buildBillingReminderEmail(items, nextUp, unsubscribeUrl);
  await sendEmail(userEmail, subject, html);
}

// Pure builder (no I/O) so the template can be previewed/tested in isolation.
export function buildBillingReminderEmail(
  items: BillingReminderItem[],
  nextUp: NextUp | null,
  unsubscribeUrl: string,
): { subject: string; html: string } {
  const soonest = Math.min(...items.map(i => i.days));
  const total = items.reduce((sum, i) => sum + (Number(i.cost_monthly) || 0), 0);

  const cards = items.map(i => {
    const when = i.days === 0 ? 'today' : i.days === 1 ? 'tomorrow' : `in ${i.days} days`;
    const cancelBtn = i.cancel_url
      ? `<a href="${escapeHtml(i.cancel_url)}" style="display:inline-block;background:#e8734a;color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:10px;font-weight:600;font-size:14px">Cancel ${escapeHtml(i.name)} →</a>`
      : `<span style="color:#9aa;font-size:13px">Add a cancel link in the app</span>`;
    return `<table role="presentation" width="100%" style="border-collapse:separate;background:#ffffff;border:1px solid #e7e7ee;border-radius:14px;margin:0 0 12px">
      <tr><td style="padding:18px 20px">
        <div style="font-weight:700;font-size:18px;color:#12121a">${escapeHtml(i.name)}</div>
        <div style="color:#6b6b78;font-size:13px;margin-top:3px">$${Number(i.cost_monthly).toFixed(2)}/mo · renews ${when}</div>
        <div style="display:inline-block;margin-top:10px;background:#fdece4;color:#c85a34;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px">Cancel by ${escapeHtml(i.renewalLabel)}</div>
        <div style="margin-top:16px">${cancelBtn}</div>
      </td></tr>
    </table>`;
  }).join('');

  let nextUpBlock = '';
  if (nextUp && nextUp.shows.length) {
    const showList = nextUp.shows
      .map(t => `<div style="color:#e9e9f0;font-size:14px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.08)">▸ ${escapeHtml(t)}</div>`)
      .join('');
    const signupBtn = nextUp.signupUrl
      ? `<div style="margin-top:16px"><a href="${escapeHtml(nextUp.signupUrl)}" style="display:inline-block;background:#3db8a0;color:#04140f;text-decoration:none;padding:11px 20px;border-radius:10px;font-weight:700;font-size:14px">Reactivate ${escapeHtml(nextUp.serviceName)} →</a></div>`
      : '';
    nextUpBlock = `
      <table role="presentation" width="100%" style="border-collapse:separate;background:#161622;border-radius:16px;margin:22px 0">
        <tr><td style="padding:20px 22px">
          <div style="color:#8a8aa0;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase">Up next in your rotation</div>
          <div style="color:#ffffff;font-size:20px;font-weight:800;margin:6px 0 2px">${escapeHtml(nextUp.serviceName)}</div>
          <div style="color:#8a8aa0;font-size:13px;margin-bottom:12px">Reactivate it and dig into these:</div>
          ${showList}
          ${signupBtn}
        </td></tr>
      </table>`;
  }

  const subject = items.length === 1
    ? `⏰ ${items[0].name} renews ${soonest === 0 ? 'today' : soonest === 1 ? 'tomorrow' : `in ${soonest} days`}`
    : `⏰ ${items.length} subscriptions renewing soon`;

  const html = `
  <div style="background:#f4f4f8;padding:28px 16px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <table role="presentation" width="100%" style="max-width:540px;margin:0 auto;border-collapse:separate">
      <tr><td style="padding:0 4px 18px">
        <span style="font-size:24px;font-weight:800;letter-spacing:-0.02em"><span style="color:#e8734a">Stream</span><span style="color:#12121a">Rotate</span></span>
      </td></tr>
      <tr><td>
        <div style="color:#3a3a46;font-size:16px;line-height:1.55;margin-bottom:18px">
          ${items.length === 1
            ? `Your <strong>${escapeHtml(items[0].name)}</strong> subscription renews soon.`
            : `You have <strong>${items.length} subscriptions</strong> renewing soon.`}
          Done watching? Cancel before the date and rotate to something new — you can always come back.
        </div>
        ${cards}
        <div style="color:#6b6b78;font-size:13px;padding:4px 4px 0">Estimated monthly total: <strong style="color:#12121a">$${total.toFixed(2)}</strong></div>
        ${nextUpBlock}
        <div style="color:#a0a0ad;font-size:12px;line-height:1.6;margin-top:24px;padding-top:16px;border-top:1px solid #e2e2ea">
          You're getting this because you track these services in StreamRotate.<br>
          Manage reminders in the app, or <a href="${escapeHtml(unsubscribeUrl)}" style="color:#a0a0ad;text-decoration:underline">unsubscribe from renewal emails</a>.
        </div>
      </td></tr>
    </table>
  </div>`;

  return { subject, html };
}

// Feedback / suggestion / bug report submitted from the app, sent to the owner.
export async function sendFeedback(fromEmail: string, category: string, message: string) {
  await sendEmail(
    OWNER_EMAIL,
    `💬 StreamRotate ${category}: ${message.slice(0, 60)}${message.length > 60 ? '…' : ''}`,
    `<h2>New ${escapeHtml(category)}</h2>
     <p><strong>From:</strong> ${escapeHtml(fromEmail)}</p>
     <p style="white-space:pre-wrap;border-left:3px solid #e8734a;padding-left:12px;color:#333">${escapeHtml(message)}</p>`,
    fromEmail,
  );
}

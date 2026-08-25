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

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ));
}

// User-facing email listing subscriptions renewing soon: each with its renewal
// (cancel-by) date and a one-tap cancel link, plus a "what to watch next" nudge
// and a one-click unsubscribe link.
export async function sendBillingReminder(
  userEmail: string,
  items: BillingReminderItem[],
  nextUp: string[],
  unsubscribeUrl: string,
) {
  if (!items.length) return;
  const soonest = Math.min(...items.map(i => i.days));
  const total = items.reduce((sum, i) => sum + (Number(i.cost_monthly) || 0), 0);

  const rows = items.map(i => {
    const when = i.days === 0 ? 'today' : i.days === 1 ? 'tomorrow' : `in ${i.days} days`;
    const cancelBtn = i.cancel_url
      ? `<a href="${escapeHtml(i.cancel_url)}" style="display:inline-block;background:#e8734a;color:#fff;text-decoration:none;padding:8px 16px;border-radius:8px;font-weight:600;font-size:14px">Cancel ${escapeHtml(i.name)}</a>`
      : `<span style="color:#888;font-size:13px">No cancel link saved</span>`;
    return `<tr>
      <td style="padding:14px 0;border-bottom:1px solid #eee">
        <div style="font-weight:600;font-size:16px;color:#1a1a24">${escapeHtml(i.name)}</div>
        <div style="color:#666;font-size:13px;margin-top:2px">$${Number(i.cost_monthly).toFixed(2)}/mo · renews ${when}</div>
        <div style="color:#e8734a;font-size:13px;margin-top:2px;font-weight:600">Cancel by ${escapeHtml(i.renewalLabel)}</div>
      </td>
      <td style="padding:14px 0;border-bottom:1px solid #eee;text-align:right">${cancelBtn}</td>
    </tr>`;
  }).join('');

  const nextUpBlock = nextUp.length
    ? `<div style="background:#f6f6fa;border-radius:12px;padding:16px;margin:20px 0">
         <div style="font-weight:700;font-size:14px;color:#1a1a24;margin-bottom:8px">▶ What to watch next</div>
         <div style="color:#444;font-size:14px;line-height:1.7">${nextUp.map(t => `• ${escapeHtml(t)}`).join('<br>')}</div>
       </div>`
    : '';

  const subject = items.length === 1
    ? `⏰ ${items[0].name} renews ${soonest === 0 ? 'today' : soonest === 1 ? 'tomorrow' : `in ${soonest} days`}`
    : `⏰ ${items.length} subscriptions renewing soon`;

  const html = `
  <div style="max-width:520px;margin:0 auto;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1a24">
    <div style="font-size:22px;font-weight:700;margin-bottom:4px"><span style="color:#e8734a">Stream</span>Rotate</div>
    <p style="color:#444;font-size:15px;line-height:1.5">
      Heads up — the ${items.length === 1 ? 'subscription below renews' : 'subscriptions below renew'} soon.
      Still watching? Keep it. Not right now? Cancel before the date and save it for later.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">${rows}</table>
    <p style="color:#666;font-size:14px">Estimated monthly total: <strong>$${total.toFixed(2)}</strong></p>
    ${nextUpBlock}
    <p style="color:#999;font-size:12px;margin-top:24px;border-top:1px solid #eee;padding-top:12px">
      You're getting this because you track these services in StreamRotate.
      Manage reminders in the app, or <a href="${escapeHtml(unsubscribeUrl)}" style="color:#999">unsubscribe from renewal emails</a>.
    </p>
  </div>`;

  await sendEmail(userEmail, subject, html);
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

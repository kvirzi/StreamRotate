import axios from 'axios';

const OWNER_EMAIL = 'kvirzi@gmail.com';
const FROM = 'StreamRotate <notifications@streamrotate.com>';

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — skipping email');
    return;
  }
  try {
    await axios.post(
      'https://api.resend.com/emails',
      { from: FROM, to, subject, html },
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

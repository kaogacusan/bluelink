// Sends email through Resend. Needs RESEND_API_KEY; EMAIL_FROM picks the sender.
const key = process.env.RESEND_API_KEY || ''
const from = process.env.EMAIL_FROM || 'BlueLink <noreply@bluelinkph.com>'

export const canMail = !!key

export async function sendMail({ to, subject, text, html }) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!r.ok) throw new Error(`resend ${r.status}: ${(await r.text()).slice(0, 200)}`)
}

export const codeMail = (code) => ({
  subject: `Your BlueLink code: ${code}`,
  text: `Your BlueLink sign-in code is ${code}\n\nIt works for 10 minutes. If you did not ask for it, ignore this email.`,
  html: `<div style="font-family:Arial,sans-serif;color:#0b1220;max-width:420px">
<p style="margin:0 0 12px">Your BlueLink sign-in code is</p>
<p style="margin:0 0 16px;font-size:32px;font-weight:700;letter-spacing:6px">${code}</p>
<p style="margin:0;color:#5b6475;font-size:13px">It works for 10 minutes. If you did not ask for it, ignore this email.</p>
</div>`,
})

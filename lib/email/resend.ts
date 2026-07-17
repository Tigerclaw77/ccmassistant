type SendEmailInput = {
  from: string;
  html: string;
  idempotencyKey: string;
  subject: string;
  text: string;
  to: string;
};

export async function sendEmailWithResend(input: SendEmailInput): Promise<{ id: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Patient email delivery is not configured");
  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({ from: input.from, html: input.html, subject: input.subject, text: input.text, to: [input.to] }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
      "User-Agent": "CCM-Assistant/1.0",
    },
    method: "POST",
  });
  const result = await response.json() as { id?: string };
  if (!response.ok || !result.id) throw new Error("Patient email delivery failed");
  return { id: result.id };
}

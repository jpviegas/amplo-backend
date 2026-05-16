import { Resend } from "resend";

function cleanEnv(value: string | undefined): string {
  return (value || "").trim().replace(/^[`"' ]+|[`"' ]+$/g, "");
}

function getApiKey(): string {
  const apiKey = cleanEnv(process.env.RESEND_API_KEY);
  if (!apiKey) {
    throw new Error("RESEND_API_KEY não definido");
  }
  return apiKey;
}

function getFromEmail(): string {
  const from = cleanEnv(process.env.RESEND_FROM_EMAIL);
  if (!from) {
    throw new Error("RESEND_FROM_EMAIL não definido");
  }
  // Validate basic email format to catch .env misconfiguration (e.g. missing newline between vars)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$|^.+\s<[^\s@]+@[^\s@]+\.[^\s@]+>$/;
  if (!emailRegex.test(from)) {
    throw new Error(`RESEND_FROM_EMAIL inválido: "${from}" — verifique o arquivo .env`);
  }
  return from;
}

function getResendClient(): Resend {
  return new Resend(getApiKey());
}

type SendTemplateEmailPayload = {
  to: string;
  subject: string;
  title: string;
  description: string;
  actionUrl?: string;
  actionLabel?: string;
  code?: string;
  supportText?: string;
};

export async function sendTemplateEmail(payload: SendTemplateEmailPayload) {
  const resend = getResendClient();
  const from = getFromEmail();

  const codeBlock = payload.code
    ? `
    <div style="margin:24px 0;padding:20px;background:#f3f4f6;border-radius:8px;text-align:center">
      <span style="display:inline-block;font-size:32px;font-weight:700;letter-spacing:8px;color:#111827">
        ${payload.code}
      </span>
    </div>
  `
    : "";

  const actionBlock =
    payload.actionUrl && payload.actionLabel
      ? `
    <a href="${payload.actionUrl}" style="display:inline-block;background:#111827;color:#ffffff;padding:12px 16px;text-decoration:none;border-radius:8px;font-weight:600">
      ${payload.actionLabel}
    </a>
    <p style="margin-top:20px;line-height:1.5;color:#6b7280">
      Se o botão não funcionar, copie e cole este link no navegador:<br />
      <span>${payload.actionUrl}</span>
    </p>
  `
      : "";

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111827">
    <h2 style="margin-bottom:16px">${payload.title}</h2>
    <p style="line-height:1.5;margin-bottom:20px">${payload.description}</p>
    ${codeBlock}
    ${actionBlock}
    ${
      payload.supportText
        ? `<p style="margin-top:12px;line-height:1.5;color:#6b7280">${payload.supportText}</p>`
        : ""
    }
  </div>
  `;

  await resend.emails.send({
    from,
    to: [payload.to],
    subject: payload.subject,
    html,
  });
}

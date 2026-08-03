import type { CompanySettings } from "@/generated/prisma";

/** Replace {{documentNumber}} / {{validUntil}} placeholders. */
export function renderTemplate(
  template: string,
  vars: Record<string, string | undefined>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

/**
 * Branded, email-client-safe HTML wrapper (inline CSS, table layout).
 */
export function wrapEmailHtml(
  company: CompanySettings,
  bodyText: string,
  heading: string,
): string {
  const paragraphs = bodyText
    .split(/\n\s*\n/)
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#1f2937;">${p
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/\n/g, "<br/>")}</p>`,
    )
    .join("");

  const logo = company.logoUrl
    ? `<img src="${company.logoUrl}" alt="${company.name}" height="44" style="height:44px;display:block;" />`
    : `<span style="font-size:20px;font-weight:800;color:#114EA9;letter-spacing:1px;">AQUALIFE <span style="color:#2FA0E4;">SERVIS</span></span>`;

  return `<!doctype html>
<html lang="sk"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(17,78,169,0.1);">
<tr><td style="height:5px;line-height:5px;font-size:0;background:#114EA9;">&nbsp;</td></tr>
<tr><td style="background:#ffffff;padding:22px 32px;border-bottom:1px solid #e2e8f0;">${logo}</td></tr>
<tr><td style="padding:32px;">
<h1 style="margin:0 0 18px;font-size:18px;color:#0B2C5E;">${heading}</h1>
${paragraphs}
</td></tr>
<tr><td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
<p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;">
<strong style="color:#114EA9;">${company.name}</strong><br/>
${company.street}, ${company.postalCode} ${company.city}<br/>
IČO: ${company.ico} · DIČ: ${company.dic}${company.icDph ? ` · IČ DPH: ${company.icDph}` : ""}<br/>
${company.email} · ${company.phone}${company.website ? ` · ${company.website}` : ""}
</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

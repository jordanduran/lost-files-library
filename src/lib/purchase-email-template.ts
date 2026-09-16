export type EmailPurchase = { title: string; license: string; itemId?: string };
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );

export function purchaseEmail(
  origin: string,
  items: EmailPurchase[],
  test: boolean,
  token?: string,
) {
  if (token && !/^[a-f0-9]{64}$/.test(token))
    throw new Error("Invalid download token");
  const url = new URL(token ? `/downloads/${token}` : "/library", origin).href;
  const logoUrl = new URL("/brand/email-logo.png", origin).href;
  const title = token ? "Your pack is ready" : "Your sounds are ready";
  const instructions = token
    ? "Download your pack ZIP and license using these buttons. No account needed. In a new browser, verify a code sent to your checkout email once to unlock downloads for seven days."
    : "Sign in with the same account used at checkout to download your files from My Library.";
  const directUrl = (item: EmailPurchase, file: string) =>
    token && item.itemId && /^[a-f0-9-]{36}$/i.test(item.itemId)
      ? new URL(`/api/delivery/${token}/${item.itemId}/${file}`, origin).href
      : url;
  const button = (href: string, label: string, secondary = false) =>
    `<a href="${escape(href)}" style="display:block;padding:15px 5px;background:${secondary ? "#0c1c2e" : "#247dff"};border:1px solid ${secondary ? "#6d85a7" : "#247dff"};border-radius:5px;color:${secondary ? "#e2e7f4" : "#0b1528"};text-decoration:none;font-size:11px;font-weight:bold;text-align:center">${label}</a>`;
  const rows = items
    .map(
      (item) =>
        `<tr><td style="padding:22px;border-bottom:1px solid #364559"><strong style="font-size:18px;line-height:1.4">${escape(item.title)}</strong><br><span style="font-size:12px;color:#bcc6d5">${escape(item.license)}</span>${token && item.itemId ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px"><tr><td width="50%" style="padding-right:5px">${button(directUrl(item, "zip"), "DOWNLOAD ZIP")}</td><td width="50%" style="padding-left:5px">${button(directUrl(item, "license"), "DOWNLOAD LICENSE", true)}</td></tr></table>` : ""}</td></tr>`,
    )
    .join("");
  return {
    subject: `${test ? "[TEST] " : ""}${title} — Lost Files Library`,
    text: `LOST FILES LIBRARY\nACCESS GRANTED\n\n${title}\n\n${items.map((item) => `${item.title} — ${item.license}${token && item.itemId ? `\nDownload ZIP: ${directUrl(item, "zip")}\nDownload license: ${directUrl(item, "license")}` : ""}`).join("\n")}\n\nDownload your files: ${url}\n\n${instructions}\n${test ? "\nTEST PURCHASE. No real money was charged.\n" : ""}`,
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="margin:0;background:#020609;font-family:Arial,Helvetica,sans-serif;color:#e2e7f4"><div style="display:none;max-height:0;overflow:hidden">${token ? "Your pack ZIP and license. No account needed." : "Your purchased sounds are ready."}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 12px"><table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background:#06111e;border:1px solid #3c526e;border-radius:12px;overflow:hidden"><tr><td align="center" style="padding:30px 24px 22px;text-align:center"><img src="${escape(logoUrl)}" alt="Lost Files Library" width="58" height="58" style="display:block;width:58px;height:58px;margin:0 auto;border:0" /><p style="font-family:monospace;font-size:10px;letter-spacing:3px;color:#a9c7ff;margin:16px 0 0">LOST FILES LIBRARY</p></td></tr><tr><td style="padding:0 24px 28px"><p style="font-size:10px;letter-spacing:1.4px;color:#a9c7ff;text-align:center">PAYMENT VERIFIED / ACCESS GRANTED</p><h1 style="font-size:34px;line-height:1.12;letter-spacing:-1px;margin:16px 0;text-align:center">${title}.</h1><p style="font-size:14px;line-height:1.7;color:#c2cad6;text-align:center;margin:0 0 24px">Files recovered. Your next session starts here.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0c1c2e;border:1px solid #364559;border-radius:8px">${rows}</table>${token && items.every((item) => item.itemId) ? `<p style="margin:24px 0;font-size:12px"><a href="${escape(url)}" style="color:#91b5fa">Open your download window</a></p>` : `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0"><tr><td style="background:#247dff;border:1px solid #247dff;border-radius:6px"><a href="${escape(url)}" style="display:inline-block;padding:16px 20px;color:#0b1528;text-decoration:none;font-size:14px;font-weight:bold">DOWNLOAD YOUR FILES</a></td></tr></table>`}<p style="font-size:13px;line-height:1.8">${instructions}</p>${test ? '<p style="font-size:12px;line-height:1.7">TEST PURCHASE · No real money was charged.</p>' : ""}<p style="font-size:11px;line-height:1.7;word-break:break-all">Button not opening? Copy this link:<br><a href="${escape(url)}" style="color:#91b5fa">${escape(url)}</a></p></td></tr><tr><td style="padding:19px 24px;border-top:1px solid #344154;color:#9baabd;font-size:10px">${items.length} item(s) · LOST FILES LIBRARY · INDEPENDENT SOUND.</td></tr></table></td></tr></table></body></html>`,
  };
}

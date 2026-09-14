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
  const button = (href: string, label: string) =>
    `<a href="${escape(href)}" style="display:inline-block;margin:12px 8px 0 0;padding:12px 16px;background:#d5d8d0;border:3px solid;border-color:#fff #464b43 #464b43 #fff;color:#172019;text-decoration:none;font-size:12px;font-weight:bold;text-align:center;min-width:120px">${label}</a>`;
  const rows = items
    .map(
      (item) =>
        `<tr><td style="padding:16px;border-bottom:1px solid #929b8b"><strong>${escape(item.title)}</strong><br><span style="font-size:12px">${escape(item.license)}</span>${token && item.itemId ? `<br>${button(directUrl(item, "zip"), "DOWNLOAD ZIP")}${button(directUrl(item, "license"), "DOWNLOAD LICENSE")}` : ""}</td></tr>`,
    )
    .join("");
  return {
    subject: `${test ? "[TEST] " : ""}${title} — Lost Files Library`,
    text: `LOST FILES LIBRARY\nACCESS GRANTED\n\n${title}\n\n${items.map((item) => `${item.title} — ${item.license}${token && item.itemId ? `\nDownload ZIP: ${directUrl(item, "zip")}\nDownload license: ${directUrl(item, "license")}` : ""}`).join("\n")}\n\nDownload your files: ${url}\n\n${instructions}\n${test ? "\nTEST PURCHASE. No real money was charged. Synthetic demo files only.\n" : ""}`,
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="margin:0;background:#0b100c;font-family:Courier New,Courier,monospace;color:#172019"><div style="display:none;max-height:0;overflow:hidden">${token ? "Your pack ZIP and license. No account needed." : "Your purchased sounds are ready."}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 12px"><table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background:#c2c5bf;border:3px solid;border-color:#eef1e9 #464b43 #464b43 #eef1e9"><tr><td style="padding:8px 12px;background:#314c3b;color:#ecf4e8;font-size:12px;font-weight:bold"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td valign="middle" style="font-size:12px;font-weight:bold;overflow-wrap:anywhere">C:&#92;LOST_FILES&#92;DOWNLOADS</td><td align="right" valign="middle" width="44" style="padding-left:12px"><img src="${escape(logoUrl)}" alt="Lost Files Library" width="32" height="32" style="display:block;width:32px;height:32px;border:0" /></td></tr></table></td></tr><tr><td style="padding:9px 16px;border-bottom:1px solid #929b8b;font-size:12px">File &nbsp; View &nbsp; Help</td></tr><tr><td style="padding:30px 24px"><p style="font-size:11px;letter-spacing:1px;color:#314c3b">PAYMENT VERIFIED / ACCESS GRANTED</p><h1 style="font-size:32px;line-height:1.1;margin:20px 0">${title}.</h1><p style="font-size:14px;line-height:1.7">Files recovered. Your next session starts here.</p><table width="100%" cellpadding="0" cellspacing="0" style="background:#dde1d7;border:2px solid;border-color:#7b8475 #eef1e9 #eef1e9 #7b8475">${rows}</table>${token && items.every(item => item.itemId) ? `<p style="margin:24px 0;font-size:12px"><a href="${escape(url)}" style="color:#314c3b">Open your download window</a></p>` : `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0"><tr><td style="background:#d5d8d0;border:3px solid;border-color:#fff #464b43 #464b43 #fff"><a href="${escape(url)}" style="display:inline-block;padding:16px 20px;color:#172019;text-decoration:none;font-size:14px;font-weight:bold">DOWNLOAD YOUR FILES</a></td></tr></table>`}<p style="font-size:13px;line-height:1.8">${instructions}</p>${test ? '<p style="font-size:12px;line-height:1.7">TEST PURCHASE · No real money was charged. Synthetic demo files only.</p>' : ""}<p style="font-size:11px;line-height:1.7;word-break:break-all">Button not opening? Copy this link:<br><a href="${escape(url)}" style="color:#314c3b">${escape(url)}</a></p></td></tr><tr><td style="padding:12px 16px;border-top:1px solid #929b8b;font-size:10px">${items.length} item(s) · LOST FILES LIBRARY · INDEPENDENT SOUND.</td></tr></table></td></tr></table></body></html>`,
  };
}

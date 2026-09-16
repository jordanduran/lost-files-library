type RecoveryOrder = { token: string; titles: string[]; is_test: boolean };
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );

export function recoveryEmail(origin: string, orders: RecoveryOrder[]) {
  const links = orders.map((order) => {
    if (!/^[a-f0-9]{64}$/.test(order.token))
      throw new Error("Invalid recovery link");
    return {
      title: `${order.is_test ? "[TEST] " : ""}${order.titles.join(", ")}`,
      url: new URL(`/downloads/${order.token}`, origin).href,
    };
  });
  const instructions =
    "Here are your most recent available purchases (up to 50). A new browser may ask for an email code before downloading. No account is required. If you did not request this email, you can ignore it.";
  return {
    subject: "Your purchase links — Lost Files Library",
    text: `LOST FILES LIBRARY\n\n${instructions}\n\n${links.map((link) => `${link.title}\n${link.url}`).join("\n\n")}`,
    html: `<html lang="en"><body style="margin:0;padding:24px;background:#010407;font-family:Arial,Helvetica,sans-serif;color:#e2e7f4"><table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;margin:auto;background:#07111b;border:1px solid #345c8a;border-radius:12px;overflow:hidden"><tr><td style="padding:12px;background:#091725;color:#e2e7f4">C:&#92;LOST_FILES&#92;RECOVERY<img src="${escape(new URL("/brand/email-logo.png", origin).href)}" alt="Lost Files Library" width="32" height="32" style="float:right;border:0" /></td></tr><tr><td style="padding:24px"><h1 style="font-size:24px">Your files are here.</h1><p style="line-height:1.7">${instructions}</p>${links.map((link) => `<p style="padding:16px;border:1px solid #34516c;line-height:1.7"><strong>${escape(link.title)}</strong><br><a href="${escape(link.url)}" style="display:inline-block;margin-top:12px;padding:12px;background:#247dff;border:1px solid #247dff;border-radius:6px;color:#0b1528;text-decoration:none">OPEN DOWNLOADS</a></p>`).join("")}</td></tr></table></body></html>`,
  };
}

import { writeFile } from "node:fs/promises";
import { purchaseEmail } from "../src/lib/purchase-email-template.ts";
const email = purchaseEmail("https://lost-files-library.vercel.app", [{ title: "Night Shift Drums", license: "Demo Pack License" }], true, "a".repeat(64));
await writeFile(new URL("../docs/purchase-email-preview.html", import.meta.url), email.html);
console.log("Email preview written to docs/purchase-email-preview.html");

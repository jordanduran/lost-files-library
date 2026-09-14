import { writeFile } from "node:fs/promises";
import { purchaseEmail } from "../src/lib/purchase-email-template.ts";
const email = purchaseEmail("https://lost-files-library.vercel.app", [{ title: "Midnight Drive", license: "WAV License" }, { title: "Velvet Skyline", license: "WAV + Stems" }], true);
await writeFile(new URL("../docs/purchase-email-preview.html", import.meta.url), email.html);
console.log("Email preview written to docs/purchase-email-preview.html");

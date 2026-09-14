import Link from "next/link";
import { afterHoursPack } from "@/lib/packs";
import { checkoutReady } from "@/lib/checkout";
import { getUser } from "@/lib/auth";
import { money } from "@/lib/utils";
import { PackCheckout } from "@/components/packs/pack-checkout";
import "@/app/downloads/downloads.css";

export default async function PackCheckoutPage({ searchParams }: { searchParams: Promise<{ canceled?: string }> }) {
  const pack = await afterHoursPack();
  const user = await getUser();
  const { canceled } = await searchParams;
  return <div className="page-width delivery-page"><section className="delivery-window">
    <div className="delivery-title">C:&#92;LOST_FILES&#92;CHECKOUT.EXE <span aria-hidden="true">_ □ ×</span></div>
    <div className="delivery-body"><span className="eyebrow">01 REVIEW / 02 PAY / 03 DOWNLOAD</span>
      <h1>{pack?.title ?? "After Hours"}</h1>
      {canceled && <p role="status">Checkout canceled. Your pack is still here when you’re ready.</p>}
      <p>One pack. Multiple beats. Your ZIP and license in one private download window.</p>
      {pack ? <><ul>{pack.tracks.map(track => <li key={track}>{track}</li>)}</ul>
        <h2>{money(pack.license.price_cents / 100)} USD</h2><p>{pack.license.name}</p><p>{pack.license.description}</p>
        <p>{pack.license.includes.join(" · ")}</p></> : <p>Release pricing and files are being prepared. Checkout opens once the pack is ready.</p>}
      <p>{user ? "You’re signed in. This purchase will also appear in My Library." : <>Continue as a guest, or <Link href="/login?next=/packs/checkout">sign in</Link> to save this purchase in My Library.</>}</p>
      <p>Enter your email at checkout. We’ll send your private download link there. No account required.</p>
      <PackCheckout enabled={Boolean(pack && checkoutReady())} />
      <p className="delivery-note">Test checkout only · No real money is charged. Demo files are not the final release.</p>
      <Link href="/packs">Back to packs</Link>
    </div></section></div>;
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { purchasedFiles } from "@/lib/downloads";
import { DownloadButton } from "@/components/account/download-button";

export default async function DownloadPage({ params }: { params: Promise<{ itemId: string }> }) {
  const user = await requireUser();
  const { itemId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(itemId)) notFound();
  const purchase = await purchasedFiles(user.id, itemId);
  if (!purchase) notFound();
  return <div className="page-width cart-page">
    <div className="page-intro"><span className="eyebrow">YOUR PURCHASE / DOWNLOADS</span>
      <h1>{purchase.title}</h1><p>{purchase.license}</p></div>
    {(process.env.DOWNLOAD_BUCKET || "lost-files-demo") === "lost-files-demo" && <p className="sample-note">These are synthetic demo WAVs for testing downloads. Final MP3, WAV, and stem packages will replace them before launch.</p>}
    {purchase.files.length ? <div className="purchase-files">{purchase.files.map(file => <div className="purchase-file" key={file.id}>
      <div><strong>{file.download_name}</strong><p>{(Number(file.size_bytes) / 1024 / 1024).toFixed(1)} MB</p></div>
      <DownloadButton itemId={itemId} fileId={file.id} />
    </div>)}</div> : <p role="status">Your files are being prepared. Please check back shortly.</p>}
    <p><Link className="text-link" href="/library">← Back to My Library</Link></p>
  </div>;
}

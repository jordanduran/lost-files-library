"use client";
import { LoadingRing } from "@/components/ui/loading-indicators";
import { useState, useTransition } from "react";
import { downloadCode } from "@/app/downloads/[token]/actions";

export function DownloadVerification({
  token,
  item,
  file,
}: {
  token: string;
  item?: string;
  file?: string;
}) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();
  const [downloadUrl, setDownloadUrl] = useState<string>();
  const [pending, startTransition] = useTransition();
  const [pendingIntent, setPendingIntent] = useState("send");
  if (downloadUrl)
    return (
      <div>
        <p role="status">Email verified. Your download is starting.</p>
        <div className="delivery-actions">
          <a className="delivery-button" href={downloadUrl}>
            Download again
          </a>
          <a className="delivery-button" href={`/downloads/${token}`}>
            Open all downloads
          </a>
        </div>
      </div>
    );
  return (
    <form
      className="delivery-verification"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const intent =
          (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") ||
          "send";
        setPendingIntent(intent);
        form.set("intent", intent);
        startTransition(async () => {
          try {
            const result = await downloadCode(form);
            setError(result.error);
            if (result.sent) setSent(true);
            if (result.url) {
              setDownloadUrl(result.url);
              window.location.assign(result.url);
            }
          } catch {
            setError("Could not connect. Please try again.");
          }
        });
      }}
    >
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="item" value={item || ""} />
      <input type="hidden" name="file" value={file || ""} />
      <p>
        Open your files with a code sent to the email used at checkout. No
        account needed.
      </p>
      {sent && (
        <>
          <p role="status">Code sent. Check your inbox and spam folder.</p>
          <label htmlFor="download-code">Email code</label>
          <input
            id="download-code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            aria-describedby={error ? "download-code-error" : undefined}
          />
        </>
      )}
      {error && (
        <p id="download-code-error" role="alert">
          {error}
        </p>
      )}
      <div className="delivery-actions">
        {sent && (
          <button
            className="delivery-button"
            name="intent"
            value="verify"
            disabled={pending}
            aria-busy={pending && pendingIntent === "verify"}
          >
            {pending && pendingIntent === "verify" && <LoadingRing />}
            {pending && pendingIntent === "verify"
              ? "Verifying…"
              : "Verify & download"}
          </button>
        )}
        <button
          className="delivery-button"
          name="intent"
          value="send"
          formNoValidate
          disabled={pending}
          aria-busy={pending && pendingIntent === "send"}
        >
          {pending && pendingIntent === "send" && <LoadingRing />}
          {pending && pendingIntent === "send"
            ? "Sending…"
            : sent
              ? "Resend code"
              : "Email me a code"}
        </button>
      </div>
      <p className="delivery-note">
        This browser stays authorized for seven days. Codes expire after ten
        minutes.
      </p>
    </form>
  );
}

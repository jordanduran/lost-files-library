import Link from "next/link";
import { RecoveryForm } from "@/components/account/recovery-form";
export const metadata = {
  title: "Find my purchases",
  robots: { index: false, follow: false },
};

export default function RecoverPage() {
  const support = process.env.SUPPORT_EMAIL;
  const validSupport = support && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(support);
  return (
    <section className="account-panel">
      <span className="eyebrow">PURCHASE RECOVERY</span>
      <h1>Find my purchases.</h1>
      <p>
        Lost your email? Enter the address you used at checkout and we’ll send
        your available download links. No account needed.
      </p>
      <RecoveryForm />
      <p>
        Already have an account? <Link href="/library">Open My Library</Link>.
      </p>
      <p>
        Use the exact checkout email, check your spam folder, and allow a few
        minutes for delivery. Refunded or unavailable purchases cannot be
        recovered here.
      </p>
      {validSupport && (
        <p>
          Still need help? <a href={`mailto:${support}`}>Contact support</a>{" "}
          with your order reference. Never send card details or download codes.
        </p>
      )}
    </section>
  );
}

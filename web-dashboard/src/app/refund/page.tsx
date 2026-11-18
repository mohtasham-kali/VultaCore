import Link from "next/link";

export const metadata = {
  title: "Refund & Cancellation Policy — VultaCore",
  description: "VultaCore's refund and cancellation terms for developer platform subscriptions and digital services.",
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-purple-500 selection:text-white">
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <div className="mb-12">
          <Link href="/" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
            ← Back to VultaCore
          </Link>
          <h1 className="text-4xl font-extrabold mt-4 mb-2 tracking-tight">Refund &amp; Cancellation Policy</h1>
          <p className="text-slate-400 text-sm">Last updated: November 18, 2026</p>
        </div>

        <div className="space-y-8 text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">1. Cancellation Policy</h2>
            <p>
              You can cancel your VultaCore subscription at any time directly through your account dashboard under{" "}
              <Link href="/subscription" className="text-purple-400 hover:underline">
                Subscription Settings
              </Link>{" "}
              or via the customer portal link provided in your billing confirmation emails.
            </p>
            <p>
              When you cancel a subscription:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Scheduled Cancellation:</strong> Your cancellation will take effect at the end of your current paid billing period. You will retain full access to your plan features until that date.
              </li>
              <li>
                <strong>No Further Charges:</strong> You will not be billed for any subsequent billing periods after cancellation is scheduled.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">2. 14-Day Refund Guarantee</h2>
            <p>
              We want you to be completely satisfied with VultaCore. If you are unsatisfied with your paid subscription for any reason, you may request a full refund within <strong>14 days</strong> of your initial purchase or renewal date.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">3. How to Request a Refund</h2>
            <p>
              Because our order processing is conducted by our online reseller and Merchant of Record, <strong>Paddle.com</strong>, refunds may be requested either through:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>VultaCore Support:</strong> Email{" "}
                <a href="mailto:support@techprogression.com" className="text-purple-400 hover:underline">
                  support@techprogression.com
                </a>{" "}
                with your account email and Paddle order / transaction ID.
              </li>
              <li>
                <strong>Paddle Buyer Support:</strong> Directly visit{" "}
                <a href="https://paddle.net" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
                  paddle.net
                </a>{" "}
                using the email address used at checkout.
              </li>
            </ul>
            <p>
              Approved refunds are processed back to the original payment method (Credit Card, PayPal, Google Pay, Apple Pay) within 5–10 business days depending on your financial institution.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">4. Exceptions</h2>
            <p>
              Refund requests submitted beyond the 14-day window or accounts terminated for violation of our Terms of Service (e.g., unlawful security attacks or abuse of developer APIs) are not eligible for refunds.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white">5. Contact Information</h2>
            <p>
              If you have any questions regarding cancellations or refunds:
              <br />
              <strong>TechProgression / VultaCore</strong>
              <br />
              Email:{" "}
              <a href="mailto:support@techprogression.com" className="text-purple-400 hover:underline">
                support@techprogression.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}


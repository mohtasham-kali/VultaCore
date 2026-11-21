import { headers } from "next/headers";
import { PricingClient } from "@/components/pricing/PricingClient";
import { getCustomerId } from "@/utils/paddle/get-customer-id";

export const metadata = {
  title: "Pricing Plans — VultaCore",
  description:
    "Transparent, predictable pricing for developers and security professionals. Free, Standard, Premium, and Enterprise tiers.",
};

export default async function PricingPage() {
  const reqHeaders = await headers();

  // Detect user's country from CDN/Edge headers. If absent, pass null so Paddle.js auto-detects from IP.
  const rawCountry =
    reqHeaders.get("x-vercel-ip-country") ||
    reqHeaders.get("cf-ipcountry") ||
    reqHeaders.get("x-country-code") ||
    null;

  // Ensure 2-letter uppercase ISO country code or null
  const country =
    rawCountry && rawCountry.trim().length === 2 && rawCountry !== "XX"
      ? rawCountry.trim().toUpperCase()
      : null;

  let customerId: string | null = null;
  try {
    const cid = await getCustomerId();
    if (cid && cid.startsWith("ctm_")) {
      customerId = cid;
    }
  } catch {
    // Non-fatal if visitor is anonymous
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-purple-500 selection:text-white">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-700/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-700/15 rounded-full blur-[100px]" />
      </div>

      <PricingClient initialCountry={country} initialCustomerId={customerId} />
    </div>
  );
}

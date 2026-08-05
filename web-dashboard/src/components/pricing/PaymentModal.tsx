"use client";

import { useState } from "react";
import { X, CreditCard, ShieldCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface GooglePayWindow extends Window {
  google: {
    payments: {
      api: {
        PaymentsClient: new (config: { environment: string }) => {
          isReadyToPay: (req: Record<string, unknown>) => Promise<{ result: boolean }>;
          loadPaymentData: (req: Record<string, unknown>) => Promise<Record<string, unknown>>;
        };
      };
    };
  };
}

import { API_BASE_URL } from "@/lib/constants";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  planPrice: string;
  userId?: string;
  userEmail?: string;
  onSuccess?: (planName: string) => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  planName,
  planPrice,
  userId,
  userEmail,
  onSuccess,
}: PaymentModalProps) {
  const [method, setMethod] = useState<"card" | "gpay" | "paypal">("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form states for Card
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [zip, setZip] = useState("");

  const formattedPrice = planPrice.startsWith("$") ? planPrice : `$${planPrice}`;

  const syncPlanToBackend = async () => {
    if (!userId) {
      console.error("Cannot sync plan: No User ID found. Make sure you are logged in.");
      return;
    }

    console.log(`📡 Syncing plan ${planName} for user ${userId}...`);

    try {
      // Primary: Direct PATCH /users/:id/plan
      const response = await fetch(`${API_BASE_URL}/users/${userId}/plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planName }),
      });

      if (!response.ok) {
        // Fallback: POST /billing/checkout
        const checkoutRes = await fetch(`${API_BASE_URL}/billing/checkout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planName,
            userId,
            userEmail: userEmail || "user@vultacore.com",
          }),
        });
        if (!checkoutRes.ok) {
          throw new Error("Failed to update plan on backend.");
        }
      }

      console.log("✅ Backend plan sync successful!");
      if (onSuccess) {
        onSuccess(planName);
      }
    } catch (err) {
      console.error("❌ Plan sync error:", err);
    }
  };

  const handleGooglePay = async () => {
    setIsProcessing(true);
    try {
      if (typeof window !== "undefined" && (window as unknown as GooglePayWindow)?.google?.payments) {
        const paymentsClient = new (window as unknown as GooglePayWindow).google.payments.api.PaymentsClient({
          environment: "TEST",
        });

        const paymentDataRequest = {
          apiVersion: 2,
          apiVersionMinor: 0,
          allowedPaymentMethods: [
            {
              type: "CARD",
              parameters: {
                allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                allowedCardNetworks: ["MASTERCARD", "VISA"],
              },
              tokenizationSpecification: {
                type: "PAYMENT_GATEWAY",
                parameters: {
                  gateway: "example",
                  gatewayMerchantId: "exampleGatewayMerchantId",
                },
              },
            },
          ],
          merchantInfo: {
            merchantId: "12345678901234567890",
            merchantName: "VultaCore Platform",
          },
          transactionInfo: {
            totalPriceStatus: "FINAL",
            totalPriceLabel: "Total",
            totalPrice: formattedPrice.replace("$", ""),
            currencyCode: "USD",
            countryCode: "US",
          },
        };

        const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest);
        console.log("Success! Token received:", paymentData);
      } else {
        // Simulated payment delay if GPay SDK is not loaded
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      await syncPlanToBackend();
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1800);
    } catch (err) {
      console.error("GPay Payment Error:", err);
      setIsProcessing(false);
    }
  };

  const handlePayPalPay = async () => {
    setIsProcessing(true);
    setTimeout(async () => {
      await syncPlanToBackend();
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1800);
    }, 1800);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    // Simulated Card processing
    setTimeout(async () => {
      await syncPlanToBackend();
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1800);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              Payment Checkout
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Upgrading to <span className="text-purple-400 font-bold">{planName}</span> Tier ({formattedPrice}/mo)
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 hover:bg-white/5 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Payment Tabs */}
        {!isSuccess && (
          <div className="flex border-b border-white/5">
            <button
              type="button"
              onClick={() => setMethod("card")}
              className={cn(
                "flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 transition-all",
                method === "card"
                  ? "text-white border-b-2 border-purple-500 bg-white/5"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <CreditCard className="w-4 h-4" />
              Credit Card
            </button>
            <button
              type="button"
              onClick={() => setMethod("gpay")}
              className={cn(
                "flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 transition-all",
                method === "gpay"
                  ? "text-white border-b-2 border-purple-500 bg-white/5"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg"
                width={40}
                height={16}
                className="h-4 w-auto grayscale invert"
                alt="GPay"
                unoptimized
              />
              Google Pay
            </button>
            <button
              type="button"
              onClick={() => setMethod("paypal")}
              className={cn(
                "flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-2 transition-all",
                method === "paypal"
                  ? "text-white border-b-2 border-purple-500 bg-white/5"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <span className="font-extrabold text-blue-400">PayPal</span>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            <div className="text-center py-10 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
                <ShieldCheck className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Payment Authorized!</h3>
              <p className="text-slate-400 text-sm">
                Your <span className="text-emerald-400 font-semibold">{planName}</span> plan has been activated successfully.
              </p>
            </div>
          ) : method === "card" ? (
            <form onSubmit={handlePayment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:border-purple-500 outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Card Number
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="4532 •••• •••• 8892"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    maxLength={19}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-purple-500 outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    placeholder="MM / YY"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    maxLength={5}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:border-purple-500 outline-none text-center font-mono"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    CVC
                  </label>
                  <input
                    type="password"
                    placeholder="•••"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    maxLength={4}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:border-purple-500 outline-none text-center font-mono"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    placeholder="10001"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    maxLength={10}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:border-purple-500 outline-none text-center"
                    required
                  />
                </div>
              </div>

              {/* Order Summary */}
              <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>{planName} Plan</span>
                  <span>{formattedPrice}/mo</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Taxes & Fees</span>
                  <span>$0.00</span>
                </div>
                <div className="border-t border-white/10 pt-1 font-bold text-white flex justify-between">
                  <span>Total Due Today</span>
                  <span className="text-purple-400">{formattedPrice}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 py-3.5 rounded-2xl text-white font-bold text-base shadow-xl shadow-purple-500/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    `Complete Payment (${formattedPrice})`
                  )}
                </button>
              </div>
            </form>
          ) : method === "gpay" ? (
            <div className="space-y-6 text-center py-4">
              <div className="p-6 border-2 border-dashed border-white/10 rounded-3xl bg-slate-950/50">
                <Image
                  src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg"
                  width={120}
                  height={32}
                  className="h-8 w-auto mx-auto mb-3 invert"
                  alt="GPay"
                  unoptimized
                />
                <p className="text-slate-400 text-xs">
                  Pay instantly using Google Pay with 1-click authorization.
                </p>
                <div className="mt-3 text-lg font-bold text-white">
                  Total: <span className="text-purple-400">{formattedPrice}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGooglePay}
                disabled={isProcessing}
                className="w-full bg-white text-black py-4 rounded-2xl font-bold text-base hover:bg-slate-100 transition-all flex items-center justify-center gap-3"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin text-black" />
                ) : (
                  <>
                    <Image
                      src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"
                      width={20}
                      height={20}
                      className="w-5 h-5"
                      alt="G"
                      unoptimized
                    />
                    Pay with Google Pay
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6 text-center py-4">
              <div className="p-6 border-2 border-dashed border-white/10 rounded-3xl bg-slate-950/50">
                <span className="text-3xl font-black tracking-tight text-blue-400 block mb-2">
                  PayPal
                </span>
                <p className="text-slate-400 text-xs">
                  Log in to your PayPal account to complete payment for {planName} plan.
                </p>
                <div className="mt-3 text-lg font-bold text-white">
                  Total: <span className="text-purple-400">{formattedPrice}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handlePayPalPay}
                disabled={isProcessing}
                className="w-full bg-yellow-400 text-slate-950 py-4 rounded-2xl font-bold text-base hover:bg-yellow-300 transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/10"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                ) : (
                  "Proceed with PayPal"
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white/5 border-t border-white/5 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            256-bit TLS Encrypted · VultaCore Payments
          </span>
        </div>
      </div>
    </div>
  );
}


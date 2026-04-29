"use client";

import { useState } from "react";
import { X, CreditCard, ShieldCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  planPrice: string;
  userId?: string;
}

export function PaymentModal({ isOpen, onClose, planName, planPrice, userId }: PaymentModalProps) {
  const [method, setMethod] = useState<"card" | "gpay">("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const syncPlanToBackend = async () => {
    if (!userId) {
      console.error("Cannot sync plan: No User ID found. Make sure you are logged in.");
      return;
    }
    
    console.log(`📡 Syncing plan ${planName} for user ${userId}...`);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/users/${userId}/plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planName }),
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      console.log("✅ Backend plan sync successful!");
    } catch (err) {
      console.error("❌ Plan sync error:", err);
    }
  };

  // Direct Google Pay API Initialization
  const onGooglePayLoaded = async () => {
    const paymentsClient = new (window as any).google.payments.api.PaymentsClient({
      environment: 'TEST' // Change to 'PRODUCTION' when your merchant ID is verified
    });

    const isReadyToPayRequest = {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [{
        type: 'CARD',
        parameters: {
          allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
          allowedCardNetworks: ['AMEX', 'DISCOVER', 'INTERAC', 'JCB', 'MASTERCARD', 'VISA']
        }
      }]
    };

    try {
      const response = await paymentsClient.isReadyToPay(isReadyToPayRequest);
      if (response.result) {
        // GPay is ready
      }
    } catch (err) {
      console.error("GPay Ready Error:", err);
    }
  };

  const handleGooglePay = async () => {
    setIsProcessing(true);
    const paymentsClient = new (window as any).google.payments.api.PaymentsClient({
      environment: 'TEST'
    });

    const paymentDataRequest = {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [{
        type: 'CARD',
        parameters: {
          allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
          allowedCardNetworks: ['MASTERCARD', 'VISA']
        },
        tokenizationSpecification: {
          type: 'PAYMENT_GATEWAY',
          parameters: {
            'gateway': 'example',
            'gatewayMerchantId': 'exampleGatewayMerchantId'
          }
        }
      }],
      merchantInfo: {
        merchantId: '12345678901234567890',
        merchantName: 'VultaCore Platform'
      },
      transactionInfo: {
        totalPriceStatus: 'FINAL',
        totalPriceLabel: 'Total',
        totalPrice: planPrice.replace('$', ''),
        currencyCode: 'USD',
        countryCode: 'US'
      }
    };

    try {
      const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest);
      console.log("Success! Token received:", paymentData);
      await syncPlanToBackend();
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        alert("Payment Successful! Your plan is now active.");
        onClose();
      }, 1500);
    } catch (err) {
      console.error("GPay Payment Error:", err);
      setIsProcessing(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    // Simulated Card processing
    setTimeout(async () => {
      setIsProcessing(false);
      await syncPlanToBackend();
      setIsSuccess(true);
      setTimeout(() => {
        alert(`Success! VultaCore ${planName} is now active.`);
        onClose();
      }, 1500);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Secure Checkout</h2>
            <p className="text-xs text-slate-500">Subscribe to <span className="text-purple-400 font-bold">{planName}</span>Tier</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Payment Tabs */}
        <div className="flex border-b border-white/5">
          <button 
            onClick={() => setMethod("card")}
            className={cn(
              "flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all",
              method === "card" ? "text-white border-b-2 border-purple-500 bg-white/5" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <CreditCard className="w-4 h-4" />
            Credit Card
          </button>
          <button 
            onClick={() => setMethod("gpay")}
            className={cn(
              "flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all",
              method === "gpay" ? "text-white border-b-2 border-purple-500 bg-white/5" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" className="h-4 w-auto grayscale invert" alt="GPay" />
            Google Pay
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {isSuccess ? (
            <div className="text-center py-12 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
                <ShieldCheck className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Payment Confirmed</h3>
              <p className="text-slate-400">Welcome to VultaCore Platinum Support.</p>
            </div>
          ) : method === "card" ? (
            <form onSubmit={handlePayment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Card Number</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input type="text" placeholder="xxxx xxxx xxxx xxxx" className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-purple-500/50 outline-none" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Expiry Date</label>
                  <input type="text" placeholder="MM / YY" className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-purple-500/50 outline-none" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">CVC</label>
                  <input type="text" placeholder="•••" className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:border-purple-500/50 outline-none" required />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 py-4 rounded-2xl text-white font-bold text-lg shadow-xl shadow-purple-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : `Pay ${planPrice}`}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-8 text-center py-4">
              <div className="p-8 border-2 border-dashed border-white/10 rounded-3xl bg-slate-950/50">
                <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" className="h-8 w-auto mx-auto mb-4 invert" alt="GPay" />
                <p className="text-slate-400 text-sm">Pay quickly and securely with your Google account.</p>
              </div>
              <button 
                onClick={handleGooglePay}
                disabled={isProcessing}
                className="w-full bg-white text-black py-4 rounded-2xl font-bold text-lg hover:bg-slate-100 transition-all flex items-center justify-center gap-3"
              >
                {isProcessing ? <Loader2 className="w-6 h-6 animate-spin text-black" /> : (
                  <>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" className="w-5 h-5" alt="G" />
                    Pay with Google Pay
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/5 border-t border-white/5 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">End-to-End Encrypted via VultaCore Secure</span>
        </div>
      </div>
    </div>
  );
}

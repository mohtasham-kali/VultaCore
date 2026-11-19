import { type Paddle, type PricePreviewParams, type PricePreviewResponse } from "@paddle/paddle-js";
import { useEffect, useState } from "react";
import { PricingTiers } from "@/constants/pricing-tier";

export type PaddlePrices = Record<string, string>;

function getLineItems(): PricePreviewParams["items"] {
  const priceSet = new Set<string>();
  PricingTiers.forEach((tier) => {
    priceSet.add(tier.priceId.month);
    priceSet.add(tier.priceId.year);
  });
  return Array.from(priceSet).map((priceId) => ({
    priceId,
    quantity: 1,
  }));
}

function getPriceAmounts(prices: PricePreviewResponse): PaddlePrices {
  return prices.data.details.lineItems.reduce<PaddlePrices>((acc, item) => {
    // Only formattedTotals.total directly from Paddle
    acc[item.price.id] = item.formattedTotals.total;
    return acc;
  }, {});
}

export function usePaddlePrices(
  paddle: Paddle | undefined,
  country?: string | null
): { prices: PaddlePrices; loading: boolean; error: string | null } {
  const [prices, setPrices] = useState<PaddlePrices>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!paddle) return;

    // 'OTHERS' or empty string is an internal sentinel meaning "let Paddle infer from IP".
    // Never pass 'OTHERS' or undefined/empty to Paddle as a country code.
    const isExplicitCountry = country && country !== "OTHERS" && country.trim().length === 2;

    const params: PricePreviewParams = {
      items: getLineItems(),
      ...(isExplicitCountry ? { address: { countryCode: country } } : {}),
    };

    setLoading(true);
    setError(null);

    paddle
      .PricePreview(params)
      .then((response) => {
        setPrices((prev) => ({ ...prev, ...getPriceAmounts(response) }));
      })
      .catch((err: unknown) => {
        console.error("Paddle.PricePreview failed:", err);
        setError("We couldn't load prices. Please refresh the page.");
      })
      .finally(() => setLoading(false));
  }, [country, paddle]);

  return { prices, loading, error };
}

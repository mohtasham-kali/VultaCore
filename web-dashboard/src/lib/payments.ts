import { API_BASE_URL } from '@/lib/constants';

/**
 * Initiates a Lemon Squeezy checkout session for a plan upgrade.
 * The backend returns either a checkout URL (for payment) or a direct plan update response.
 * After receiving the URL, the browser is redirected to complete the payment.
 */
export async function startUpgrade(planName: string, userId: string, userEmail: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/billing/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planName, userId, userEmail }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create checkout session: ${errorText}`);
    }

    const data = await response.json();
    // Backend may return { checkoutUrl } or { checkoutUrl, newPlan } for direct updates.
    const url = data.checkoutUrl;
    if (url) {
      // If a newPlan is also returned, the upgrade was performed without payment.
      if (data.newPlan) {
        alert(`Plan upgraded to ${data.newPlan} without additional payment.`);
      }
      // Redirect to the checkout URL (or success URL if direct update).
      window.location.href = url;
    } else {
      throw new Error('No checkout URL received from server');
    }
  } catch (err) {
    console.error('Upgrade error:', err);
    alert('Unable to start upgrade. See console for details.');
  }
}

# TODO - Billing + Hostinger build fixes

## Billing (Lemon Squeezy)
- [x] Fix frontend POST endpoint to match Nest global prefix: `/api/billing/checkout`.
- [ ] Fix runtime env for backend so `LS_VARIANT_STANDARD` and `LS_VARIANT_PREMIUM` are present (requires setting env in running backend + restart).
- [ ] Ensure Enterprise env var name matches backend expectation: `LS_VARIANT_ENTERPRISE` (not `LS_VARIANT_ENTERPISE`).

## UI
- [x] Prevent “Most Popular” badge overlap on subscription cards.

## Hostinger/Next build blockers
- [ ] Fix TypeScript error: missing types for `nprogress` (NavigationEvents.tsx).
- [ ] Fix NextFontError: avoid failing to fetch “Geist Mono” during build (use `next/font/local` or remove remote fetch).


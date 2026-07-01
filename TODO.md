# TODO

## Billing upgrade-plan popup fix
- [x] Locate frontend call to `/billing/checkout`.
- [x] Identify NestJS global prefix `api` causing correct route to be `/api/billing/checkout`.
- [x] Update `web-dashboard/src/app/(app)/subscription/page.tsx` to call `/api/billing/checkout`.

## Hostinger build failure (WebGPU types)
- [x] Fix TypeScript error in `web-dashboard/src/lib/local-ai.ts` for `navigator.gpu` (use type assertion fallback).
- [ ] Re-run `next build` (web-dashboard) and verify build succeeds.



# LedgerLens — Notes

Assumptions, deviations, installed versions, and added dependencies for the LEDGERLENS_AGENT_BUILD_SPEC.

## Versions recorded at build time
- pocketbase: 0.29.0
- zod: 4.6.7
- unpdf: 1.9.1
- pdfkit: 0.20.2
- tsx: 4.23.15
- svelte: 5.57.3
- vitest: 4.1.12
- tailwindcss: 4.3.5
- dotenv: 18.0.10
- @fontsource-variable/inter: 5.3.0

## Assumptions
- The demo runs on a single PocketBase instance; the audit hash chain uses an in-process promise queue (mutex) because two writes could otherwise collide on `seq`. This is noted in Section 9.1 of the spec.
- `design/stitch/` is empty, so Phase 10b (Stitch skin) is not applied; the UI is built from Section 11.1–11.3 directly (Phase 10a).
- Synthetic/demo data only; no real company, person, or bank data is used.
- `LLM_PROVIDER=mock` is the default and works with no network or API key.
- Dates on PocketBase are stored as `YYYY-MM-DD HH:mm:ss.SSSZ`; display slices the first 10 characters.
- The mock LLM provider only supports the 10 sample invoices (reads `data/sample/expected/<key>.json`).

## Deviations from the spec
- None yet.

## Added dependencies (beyond the scaffold)
- Runtime: pocketbase, zod, unpdf, dotenv, @fontsource-variable/inter
- Dev: pdfkit, @types/pdfkit, tsx

## PocketBase setup
- Download the latest stable binary and place it at `./pocketbase/pocketbase` (see `pocketbase/README.md`).
- `npm run pb:serve` starts it on `http://127.0.0.1:8090`.
- Create the superuser with `./pocketbase/pocketbase superuser upsert <email> <password>` matching `.env.example`, then `npm run pb:setup`.

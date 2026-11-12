# LedgerLens — AI-Assisted Invoice Review

A SvelteKit + PocketBase application for reviewing vendor invoices. Upload PDFs, extract line items via LLM (mock), validate against purchase orders and GL accounts, flag discrepancies, and approve/reject with a full audit trail.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | SvelteKit 3.2.0, Svelte 5.57.3 (runes), Tailwind CSS 4.3.5 |
| Backend | PocketBase 0.40.6 (Go, embedded SQLite) |
| Auth | PocketBase auth collections, httpOnly cookies |
| Testing | Vitest 4.1.12, Playwright |
| Language | TypeScript (strict) |

## Features

- **Upload queue** — drag-and-drop up to 20 PDFs (10 MB each), magic-byte validation
- **Extraction pipeline** — PDF → LLM mock → structured line items + GL code suggestions
- **Validation engine** — 7 built-in rules (totals, PO presence, GL validity, duplicates, etc.)
- **Review UI** — per-invoice detail page with line items, confidence scores, GL picker, approve/reject
- **Audit log** — tamper-evident chain (hash-linked entries) with verification endpoint
- **Export** — CSV download of reviewed invoices

## Quick Start

```bash
# Install deps
npm install

# Start PocketBase (terminal 1)
./pocketbase/pocketbase serve --http=127.0.0.1:8090 --dir=./pocketbase/pb_data

# Start dev server (terminal 2)
npm run dev
# → http://localhost:5173
```

## Routes

| Path | Access | Purpose |
|------|--------|---------|
| `/` | public | Landing page / case study (signed-in users redirect to `/queue`) |
| `/login` | public | One-click demo entry |
| `/queue` | auth | Invoice queue, filters, pagination, batch actions |
| `/invoices/[id]` | auth | Review, GL override, approve/reject |
| `/audit` | auth | Tamper-evident audit log |
| `/downloads/ledgerlens-sample-invoices.zip` | public | 10 sample PDFs with intentional errors |

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Reviewer | `reviewer@ledgerlens.test` | `Demo-Reviewer-123!` |

Admin superuser: `admin@ledgerlens.test` / `Admin-Demo-12345!` (PocketBase Admin UI at `http://127.0.0.1:8090/_/`)

## Scripts

```bash
npm run dev        # Start Vite dev server
npm run build      # Production build (adapter-node)
npm run check      # svelte-check (types)
npm run test       # Vitest unit tests
npm run test:ui    # Vitest UI
npx playwright test # E2E tests
```

## Project Structure

```
src/
├── routes/
│   ├── +page.svelte          # Public landing / case study
│   ├── queue/                # Upload queue + review actions
│   │   ├── +page.svelte
│   │   └── +page.server.ts
│   ├── login/                # Auth pages
│   ├── api/invoices/[id]/process/  # Extraction pipeline endpoint
│   └── invoices/[id]/        # Detail page (review, approve/reject)
├── lib/
│   ├── server/
│   │   ├── core/
│   │   │   ├── money.ts      # Decimal-safe money math
│   │   │   ├── validation.ts # 7 validation rules
│   │   │   ├── audit.ts      # Hash-linked audit log
│   │   │   └── pipeline.ts   # PDF → lines → GL → validate
│   │   └── pb/               # PocketBase admin/client helpers
│   └── components/           # UI components (StatusChip, Icon, etc.)
scripts/
├── generate-sample-invoices.ts  # Creates 10 test PDFs with intentional errors
static/downloads/               # ledgerlens-sample-invoices.zip (10 PDFs)
tests/                          # Vitest + Playwright
pocketbase/                     # PocketBase binary + pb_data (gitignored)
```

## Sample Data

```bash
npx tsx scripts/generate-sample-invoices.ts
# Creates 10 PDFs in scripts/generated-pdfs/ with known validation issues
```

## Validation Rules

| ID | Rule | Severity |
|----|------|----------|
| V001 | Line items sum matches subtotal | blocking |
| V002 | Subtotal + tax = total | blocking |
| V003 | Tax rate reasonable | warning |
| V004 | No duplicate invoice | blocking |
| V005 | PO number present | blocking |
| V006 | Total within PO tolerance | blocking |
| V007 | Vendor matches PO vendor | blocking |
| V008 | Due date not before invoice date | blocking |
| V009 | Quantity × price = amount | warning |

## Audit Log

Each sensitive action (upload, process, approve, reject, line update) writes an entry:

```json
{
  "invoice": "record_id",
  "action": "approve",
  "actor": "user_id",
  "timestamp": "ISO8601",
  "prev_hash": "sha256_of_previous_entry",
  "hash": "sha256(this_entry)"
}
```

Verify chain integrity: `GET /api/audit/verify?invoice=<id>`

## Deploy (Dokploy)

- Use `expose: ["5173"]` in compose (no host `ports:`)
- Set `ORIGIN=https://your-domain.com` + trust proxy headers (`x-forwarded-proto`, `x-forwarded-host`)
- PocketBase data dir must be a persistent volume

## License

MIT
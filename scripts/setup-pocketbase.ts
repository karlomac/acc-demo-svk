import 'dotenv/config'
import { getConfig } from '../src/lib/server/core/config.ts'
import PocketBase from 'pocketbase'
import { readFileSync } from 'node:fs'

const config = getConfig()

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n')
  if (lines.length === 0) return []
  const header = lines[0].split(',').map((h) => h.trim())
  return lines
    .slice(1)
    .filter((l) => l.trim().length > 0)
    .map((line) => {
      const values = line.split(',').map((v) => v.trim())
      const row: Record<string, string> = {}
      header.forEach((h, i) => {
        row[h] = values[i] ?? ''
      })
      return row
    })
}

async function ensureCollection(pb: PocketBase, name: string, body: any) {
  let coll: any
  try {
    coll = await pb.collections.getOne(name)
    console.log(`[setup] collection '${name}' already exists (id=${coll.id})`)
  } catch (err: any) {
    if (err && err.status === 404) {
      coll = await pb.collections.create(body)
      console.log(`[setup] created collection '${name}' (id=${coll.id})`)
    } else {
      throw err
    }
  }
  return coll
}

async function seedIfEmpty(pb: PocketBase, collection: string, rows: Record<string, string>[]) {
  const existing = await pb.collection(collection).getFullList()
  if (existing.length > 0) {
    console.log(`[setup] '${collection}' not empty, skipping seed (${existing.length} rows)`)
    return
  }
  for (const row of rows) {
    await pb.collection(collection).create(row)
  }
  console.log(`[setup] seeded '${collection}' with ${rows.length} rows`)
}

async function main() {
  const pb = new PocketBase(config.POCKETBASE_URL)
  await pb.collection('_superusers').authWithPassword(
    config.PB_SUPERUSER_EMAIL,
    config.PB_SUPERUSER_PASSWORD
  )
  console.log(`[setup] authenticated as superuser ${config.PB_SUPERUSER_EMAIL}`)

  const commonTimestamps = [
    { name: 'created', type: 'autodate', onCreate: true },
    { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
  ]

  // 1. accounts
  const accounts = await ensureCollection(pb, 'accounts', {
    name: 'accounts',
    type: 'base',
    fields: [
      { name: 'code', type: 'text', required: true },
      { name: 'name', type: 'text', required: true },
      { name: 'type', type: 'select', values: ['asset', 'liability', 'expense'], maxSelect: 1 },
      { name: 'active', type: 'bool' },
      ...commonTimestamps,
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: null,
    updateRule: null,
    deleteRule: null,
    indexes: ['CREATE UNIQUE INDEX `idx_accounts_code` ON `accounts` (`code`)'],
  })

  // 2. purchase_orders
  const purchaseOrders = await ensureCollection(pb, 'purchase_orders', {
    name: 'purchase_orders',
    type: 'base',
    fields: [
      { name: 'po_number', type: 'text', required: true },
      { name: 'vendor_name', type: 'text', required: true },
      { name: 'amount', type: 'number', required: true },
      { name: 'currency', type: 'text' },
      { name: 'status', type: 'select', values: ['open', 'closed'], maxSelect: 1 },
      ...commonTimestamps,
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: null,
    updateRule: null,
    deleteRule: null,
    indexes: ['CREATE UNIQUE INDEX `idx_purchase_orders_po_number` ON `purchase_orders` (`po_number`)'],
  })

  // 3. invoices
  const invoices = await ensureCollection(pb, 'invoices', {
    name: 'invoices',
    type: 'base',
    fields: [
      { name: 'file', type: 'file', maxSelect: 1, maxSize: 10485760, mimeTypes: ['application/pdf'], protected: true },
      { name: 'original_filename', type: 'text' },
      { name: 'status', type: 'select', values: ['uploaded', 'processing', 'needs_review', 'flagged', 'approved', 'rejected', 'error'], maxSelect: 1 },
      { name: 'error_message', type: 'text' },
      { name: 'vendor_name', type: 'text' },
      { name: 'invoice_number', type: 'text' },
      { name: 'invoice_date', type: 'date' },
      { name: 'due_date', type: 'date' },
      { name: 'payment_terms', type: 'text' },
      { name: 'po_number', type: 'text' },
      { name: 'currency', type: 'text' },
      { name: 'subtotal', type: 'number' },
      { name: 'tax', type: 'number' },
      { name: 'total', type: 'number' },
      { name: 'extraction_json', type: 'json', maxSize: 2000000 },
      { name: 'validation_json', type: 'json', maxSize: 2000000 },
      { name: 'extraction_provider', type: 'text' },
      { name: 'extraction_model', type: 'text' },
      { name: 'reviewer_note', type: 'text' },
      { name: 'reviewed_by', type: 'text' },
      { name: 'reviewed_at', type: 'date' },
      ...commonTimestamps,
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: null,
    updateRule: null,
    deleteRule: null,
    indexes: [],
  })

  const invoiceId = invoices.id

  // 4. invoice_lines
  await ensureCollection(pb, 'invoice_lines', {
    name: 'invoice_lines',
    type: 'base',
    fields: [
      { name: 'invoice', type: 'relation', collectionId: invoiceId, maxSelect: 1, cascadeDelete: true },
      { name: 'line_no', type: 'number' },
      { name: 'description', type: 'text' },
      { name: 'quantity', type: 'number' },
      { name: 'unit_price', type: 'number' },
      { name: 'amount', type: 'number' },
      { name: 'suggested_account_code', type: 'text' },
      { name: 'confidence', type: 'number' },
      { name: 'reason', type: 'text' },
      { name: 'final_account_code', type: 'text' },
      { name: 'needs_review', type: 'bool' },
      { name: 'confirmed', type: 'bool' },
      ...commonTimestamps,
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: null,
    updateRule: null,
    deleteRule: null,
    indexes: [],
  })

  // 5. audit_log
  await ensureCollection(pb, 'audit_log', {
    name: 'audit_log',
    type: 'base',
    fields: [
      { name: 'seq', type: 'number', required: true },
      { name: 'ts', type: 'text', required: true },
      { name: 'event', type: 'text', required: true },
      { name: 'actor', type: 'text', required: true },
      { name: 'invoice', type: 'relation', collectionId: invoiceId, maxSelect: 1, cascadeDelete: false },
      { name: 'before', type: 'json' },
      { name: 'after', type: 'json' },
      { name: 'meta', type: 'json' },
      { name: 'prev_hash', type: 'text', required: true },
      { name: 'hash', type: 'text', required: true },
      ...commonTimestamps,
    ],
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: null,
    updateRule: null,
    deleteRule: null,
    indexes: ['CREATE UNIQUE INDEX `idx_audit_log_seq` ON `audit_log` (`seq`)'],
  })

  // Seed
  const accountsRows = parseCsv(readFileSync('data/seed/accounts.csv', 'utf8'))
  await seedIfEmpty(pb, 'accounts', accountsRows)

  const posRows = parseCsv(readFileSync('data/seed/purchase_orders.csv', 'utf8')).map((row) => ({
    ...row,
    amount: Number(row.amount),
  }))
  await seedIfEmpty(pb, 'purchase_orders', posRows as any)

  // Demo user
  const existingUser = await pb
    .collection('users')
    .getFirstListItem(`email = {:email}`, { email: config.DEMO_USER_EMAIL })
    .catch(() => null)
  if (!existingUser) {
    await pb.collection('users').create({
      email: config.DEMO_USER_EMAIL,
      password: config.DEMO_USER_PASSWORD,
      passwordConfirm: config.DEMO_USER_PASSWORD,
      emailVisibility: true,
      verified: true,
    })
    console.log(`[setup] created demo user ${config.DEMO_USER_EMAIL}`)
  } else {
    console.log(`[setup] demo user ${config.DEMO_USER_EMAIL} already exists`)
  }

  console.log('[setup] done')
}

main().catch((err) => {
  console.error('[setup] failed:', err)
  process.exit(1)
})

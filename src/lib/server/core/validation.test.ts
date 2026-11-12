import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { validateInvoice, decideStatus, failedIds, normalizeName, similarity } from './validation.ts'
import { toCents } from './money.ts'

const EXPECTED_DIR = join(process.cwd(), 'data', 'sample', 'expected')

function expected(key: string) {
	return JSON.parse(readFileSync(join(EXPECTED_DIR, `${key}.json`), 'utf8'))
}

const POs = [
	{ po_number: 'PO-1001', vendor_name: 'Northwind Office Supply', amount: 1250.00 },
	{ po_number: 'PO-1002', vendor_name: 'Brightline Cleaning Co.', amount: 2400.00 },
	{ po_number: 'PO-1003', vendor_name: 'Harbor IT Services', amount: 8000.00 },
	{ po_number: 'PO-1004', vendor_name: 'Summit Legal Partners', amount: 5000.00 },
	{ po_number: 'PO-1005', vendor_name: 'Greenleaf Landscaping', amount: 1800.00 },
	{ po_number: 'PO-1006', vendor_name: 'Atlas Freight Lines', amount: 3200.00 },
	{ po_number: 'PO-1007', vendor_name: 'Northwind Office Supply', amount: 640.00 },
	{ po_number: 'PO-1008', vendor_name: 'Harbor IT Services', amount: 12500.00 },
	{ po_number: 'PO-1009', vendor_name: 'Brightline Cleaning Co.', amount: 950.00 },
	{ po_number: 'PO-1010', vendor_name: 'Atlas Freight Lines', amount: 1475.00 },
	{ po_number: 'PO-1011', vendor_name: 'Summit Legal Partners', amount: 2250.00 },
	{ po_number: 'PO-1012', vendor_name: 'Greenleaf Landscaping', amount: 720.00 },
	{ po_number: 'PO-1013', vendor_name: 'Pacific Telecom', amount: 399.00 },
	{ po_number: 'PO-1014', vendor_name: 'Metro Power & Light', amount: 3430.00 },
	{ po_number: 'PO-1015', vendor_name: 'Sterling Insurance Group', amount: 6400.00 },
	{ po_number: 'PO-1016', vendor_name: 'Bluepeak Advertising', amount: 4500.00 },
	{ po_number: 'PO-1017', vendor_name: 'Ridgeway Equipment Rentals', amount: 3750.00 },
	{ po_number: 'PO-1018', vendor_name: 'Northwind Office Supply', amount: 310.00 },
	{ po_number: 'PO-1019', vendor_name: 'Harbor IT Services', amount: 2000.00 },
	{ po_number: 'PO-1020', vendor_name: 'Atlas Freight Lines', amount: 880.00 },
]

// [key, expected status, failed blocking ids, failed warning ids]
const CASES: Array<[string, 'flagged' | 'needs_review', string[], string[]]> = [
	['invoice_01', 'needs_review', [], []],
	['invoice_02', 'needs_review', [], []],
	['invoice_03', 'flagged', ['V004'], []],
	['invoice_04', 'flagged', ['V001'], []],
	['invoice_05', 'flagged', ['V005'], []],
	['invoice_06', 'needs_review', [], ['V007']],
	['invoice_07', 'flagged', ['V006'], []],
	['invoice_08', 'needs_review', [], ['V003']],
	['invoice_09', 'needs_review', [], []],
	['invoice_10', 'needs_review', [], []],
]

// Invoice 03 is a duplicate of invoice 01.
const EXISTING: Record<string, { id: string; vendor_name: string; invoice_number: string }[]> = {
	invoice_03: [{ id: 'invoice_01', vendor_name: 'Northwind Office Supply', invoice_number: 'INV-2026-0101' }],
}

describe('validateInvoice', () => {
	for (const [key, expStatus, expBlocking, expWarnings] of CASES) {
		it(key, () => {
			const extracted = expected(key)
			const existing = EXISTING[key] ?? []
			const results = validateInvoice(extracted, {
				purchaseOrders: POs,
				existingInvoices: existing,
				currentInvoiceId: key,
				poTolerancePct: 5,
			})
			expect(decideStatus(results)).toBe(expStatus)
			expect(failedIds(results, 'blocking')).toEqual(expBlocking)
			expect(failedIds(results, 'warning')).toEqual(expWarnings)
		})
	}
})

describe('normalizeName', () => {
	it('lowercases and collapses spaces', () => {
		expect(normalizeName('Northwind Office Supply')).toBe('northwind office supply')
	})
	it('removes punctuation and trailing company words', () => {
		expect(normalizeName('Brightline Cleaning Co.')).toBe('brightline cleaning')
		expect(normalizeName('Greenleaf Landscaping LLC')).toBe('greenleaf landscaping')
		expect(normalizeName('Metro Power & Light')).toBe('metro power light')
	})
})

describe('similarity', () => {
	it('is 1 for identical strings', () => {
		expect(similarity('abc', 'abc')).toBe(1)
	})
	it('is 0 for completely different', () => {
		expect(similarity('abc', 'xyz')).toBe(0)
	})
	it('is high for a one-character typo', () => {
		expect(similarity('greenleaf', 'greenleef')).toBeGreaterThan(0.8)
	})
})

describe('toCents', () => {
	it('rounds to integer cents', () => {
		expect(toCents(1252.80)).toBe(125280)
		expect(toCents(0.1 + 0.2)).toBe(30) // 0.30000000000000004 -> 30 cents
		expect(toCents(100)).toBe(10000)
	})
})

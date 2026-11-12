import { describe, expect, it } from 'vitest'
import { MockProvider } from './mock.ts'
import { extractionSchema, glResultSchema } from './index.ts'
import { SAMPLE_INVOICES } from '../../../../../scripts/sample-invoices'

const ACCOUNTS = [
	{ code: '1500', name: 'Prepaid Expenses' },
	{ code: '1600', name: 'Fixed Assets - Equipment' },
	{ code: '2000', name: 'Accounts Payable' },
	{ code: '5000', name: 'Office Supplies' },
	{ code: '5100', name: 'Cleaning & Janitorial' },
	{ code: '5200', name: 'IT Services & Software' },
	{ code: '5300', name: 'Legal & Professional Fees' },
	{ code: '5400', name: 'Landscaping & Grounds' },
	{ code: '5500', name: 'Freight & Shipping' },
	{ code: '5600', name: 'Repairs & Maintenance' },
	{ code: '5700', name: 'Utilities' },
	{ code: '5800', name: 'Insurance' },
	{ code: '5900', name: 'Travel & Meals' },
	{ code: '6000', name: 'Marketing & Advertising' },
	{ code: '6100', name: 'Telephone & Internet' },
	{ code: '6200', name: 'Equipment Rental & Small Equipment' },
]

// Expected needs_review line counts per Section 12.2 (mock GL, threshold 0.75)
const EXPECTED_NEEDS_REVIEW: Record<string, number> = {
	invoice_01: 0,
	invoice_02: 0,
	invoice_03: 0,
	invoice_04: 0,
	invoice_05: 0,
	invoice_06: 0,
	invoice_07: 0,
	invoice_08: 1,
	invoice_09: 4,
	invoice_10: 1,
}

const provider = new MockProvider()

describe('mock provider', () => {
	it('extracts all 10 sample invoices against the schema', async () => {
		for (const inv of SAMPLE_INVOICES) {
			const result = await provider.extractInvoice({ pdf: new Uint8Array(0), filename: `${inv.key}.pdf` })
			const parsed = extractionSchema.parse(result.data)
			expect(parsed.vendor_name).toBe(inv.vendor_name)
			expect(parsed.invoice_number).toBe(inv.invoice_number)
			expect(parsed.total).toBe(inv.total)
			expect(parsed.line_items.length).toBe(inv.lines.length)
		}
	})

	it('produces GL results matching expected needs_review counts', async () => {
		for (const inv of SAMPLE_INVOICES) {
			const result = await provider.suggestGlCodes({
				vendorName: inv.vendor_name,
				lines: inv.lines.map((l, i) => ({ line_no: i + 1, description: l.description, amount: l.amount })),
				accounts: ACCOUNTS,
			})
			const parsed = glResultSchema.parse(result.data)
			expect(parsed.suggestions.length).toBe(inv.lines.length)
			const needsReview = parsed.suggestions.filter((s) => s.confidence < 0.75).length
			expect(needsReview).toBe(EXPECTED_NEEDS_REVIEW[inv.key])
		}
	})

	it('throws for non-sample invoices', async () => {
		await expect(provider.extractInvoice({ pdf: new Uint8Array(0), filename: 'unknown.pdf' })).rejects.toThrow(
			'Mock provider only supports the sample invoices',
		)
	})
})

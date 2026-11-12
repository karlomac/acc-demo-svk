import { toCents, fromCents, sumCents, withinCent, money } from './money.ts'
import type { ExtractedInvoice } from './schemas.ts'

export type Severity = 'blocking' | 'warning'
export type CheckStatus = 'pass' | 'fail' | 'skip'

export interface CheckResult {
	id: string
	title: string
	severity: Severity
	status: CheckStatus
	message: string
}

interface Po {
	po_number: string
	vendor_name: string
	amount: number
}

interface ExistingInvoice {
	id: string
	vendor_name: string
	invoice_number: string
}

interface ValidateCtx {
	purchaseOrders: Po[]
	existingInvoices: ExistingInvoice[]
	currentInvoiceId?: string
	poTolerancePct: number
}

export function normalizeName(s: string): string {
	return s
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/\b(inc|llc|ltd|co|corp|company)\b$/, '')
		.trim()
}

function levenshtein(a: string, b: string): number {
	const m = a.length
	const n = b.length
	const dp: number[][] = []
	for (let i = 0; i <= m; i++) dp[i] = [i]
	for (let j = 0; j <= n; j++) dp[0][j] = j
	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			dp[i][j] = Math.min(
				dp[i - 1][j] + 1,
				dp[i][j - 1] + 1,
				dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
			)
		}
	}
	return dp[m][n]
}

export function similarity(a: string, b: string): number {
	const la = a.length
	const lb = b.length
	const max = Math.max(la, lb)
	if (max === 0) return 1
	return 1 - levenshtein(a, b) / max
}

function parseDate(s: string | null): Date | null {
	if (!s) return null
	const d = new Date(s + 'T00:00:00Z')
	if (Number.isNaN(d.getTime())) return null
	return d
}

export function validateInvoice(extracted: ExtractedInvoice, ctx: ValidateCtx): CheckResult[] {
	const { purchaseOrders, existingInvoices, currentInvoiceId, poTolerancePct } = ctx
	const results: CheckResult[] = []

	const lineItems = extracted.line_items
	const subtotalCents = toCents(extracted.subtotal)
	const taxCents = toCents(extracted.tax)
	const totalCents = toCents(extracted.total)
	const linesSumCents = sumCents(lineItems.map((l) => l.amount))

	// V001: line items sum == subtotal (±1 cent)
	const v001Pass = withinCent(fromCents(linesSumCents), extracted.subtotal)
	results.push({
		id: 'V001',
		title: 'Line items sum matches subtotal',
		severity: 'blocking',
		status: v001Pass ? 'pass' : 'fail',
		message: v001Pass
			? ''
			: `Line items sum to ${money(fromCents(linesSumCents))} but subtotal is ${money(extracted.subtotal)}`,
	})

	// V002: subtotal + tax == total (±1 cent)
	const v002Pass = withinCent(extracted.subtotal + extracted.tax, extracted.total)
	results.push({
		id: 'V002',
		title: 'Subtotal plus tax matches total',
		severity: 'blocking',
		status: v002Pass ? 'pass' : 'fail',
		message: v002Pass
			? ''
			: `Subtotal + tax is ${money(extracted.subtotal + extracted.tax)} but total is ${money(extracted.total)}`,
	})

	// V003: warning tax rate between 0 and 0.20 (skip if subtotal 0)
	let v003: CheckResult
	if (extracted.subtotal === 0) {
		v003 = { id: 'V003', title: 'Tax rate reasonable', severity: 'warning', status: 'skip', message: '' }
	} else {
		const rate = extracted.tax / extracted.subtotal
		const pass = rate >= 0 && rate <= 0.2
		v003 = {
			id: 'V003',
			title: 'Tax rate reasonable',
			severity: 'warning',
			status: pass ? 'pass' : 'fail',
			message: pass ? '' : `Tax rate ${(rate * 100).toFixed(2)}% is unusually high`,
		}
	}
	results.push(v003)

	// V004: duplicate invoice_number + normalized vendor, different id
	const normVendor = normalizeName(extracted.vendor_name)
	const dup = existingInvoices.find(
		(iv) =>
			iv.id !== currentInvoiceId &&
			iv.invoice_number === extracted.invoice_number &&
			normalizeName(iv.vendor_name) === normVendor,
	)
	const v004Pass = !dup
	results.push({
		id: 'V004',
		title: 'No duplicate invoice',
		severity: 'blocking',
		status: v004Pass ? 'pass' : 'fail',
		message: v004Pass ? '' : `Duplicate of invoice ${dup!.id}`,
	})

	// V005: PO present and exists
	let matchedPo: Po | undefined
	let v005: CheckResult
	if (!extracted.po_number) {
		v005 = { id: 'V005', title: 'PO number present', severity: 'blocking', status: 'fail', message: 'Missing PO number' }
	} else {
		matchedPo = purchaseOrders.find((p) => p.po_number === extracted.po_number)
		v005 = matchedPo
			? { id: 'V005', title: 'PO number present', severity: 'blocking', status: 'pass', message: '' }
			: { id: 'V005', title: 'PO number present', severity: 'blocking', status: 'fail', message: `PO ${extracted.po_number} not found` }
	}
	results.push(v005)

	const po5Failed = v005.status === 'fail'

	// V006: total within tolerance of PO amount (skip if V005 failed)
	let v006: CheckResult
	if (po5Failed || !matchedPo) {
		v006 = { id: 'V006', title: 'Total within PO tolerance', severity: 'blocking', status: 'skip', message: '' }
	} else {
		const pct = matchedPo.amount === 0 ? 0 : (Math.abs(extracted.total - matchedPo.amount) / matchedPo.amount) * 100
		const pass = pct <= poTolerancePct
		v006 = {
			id: 'V006',
			title: 'Total within PO tolerance',
			severity: 'blocking',
			status: pass ? 'pass' : 'fail',
			message: pass ? '' : `Total ${money(extracted.total)} differs from PO amount ${money(matchedPo.amount)} by ${pct.toFixed(2)}%`,
		}
	}
	results.push(v006)

	// V007: vendor vs PO vendor (skip if V005 failed)
	let v007: CheckResult
	if (po5Failed || !matchedPo) {
		v007 = { id: 'V007', title: 'Vendor matches PO vendor', severity: 'blocking', status: 'skip', message: '' }
	} else {
		const normPoVendor = normalizeName(matchedPo.vendor_name)
		const exact = normVendor === normPoVendor
		const sim = similarity(normVendor, normPoVendor)
		if (exact) {
			v007 = { id: 'V007', title: 'Vendor matches PO vendor', severity: 'blocking', status: 'pass', message: '' }
		} else if (sim >= 0.8) {
			v007 = {
				id: 'V007',
				title: 'Vendor matches PO vendor',
				severity: 'warning',
				status: 'fail',
				message: `Vendor "${extracted.vendor_name}" differs from PO vendor "${matchedPo.vendor_name}"`,
			}
		} else {
			v007 = {
				id: 'V007',
				title: 'Vendor matches PO vendor',
				severity: 'blocking',
				status: 'fail',
				message: `Vendor "${extracted.vendor_name}" differs from PO vendor "${matchedPo.vendor_name}"`,
			}
		}
	}
	results.push(v007)

	// V008: due_date not earlier than invoice_date; both valid
	const invDate = parseDate(extracted.invoice_date)
	const dueDate = parseDate(extracted.due_date)
	const v008Pass = invDate !== null && (dueDate === null || dueDate >= invDate)
	results.push({
		id: 'V008',
		title: 'Due date not before invoice date',
		severity: 'blocking',
		status: v008Pass ? 'pass' : 'fail',
		message: v008Pass ? '' : 'Due date is before invoice date',
	})

	// V009: warning qty * unit_price == amount per line (±1 cent)
	const lineFails = lineItems.filter((l) => !withinCent(l.quantity * l.unit_price, l.amount))
	const v009Pass = lineFails.length === 0
	results.push({
		id: 'V009',
		title: 'Line quantity times price equals amount',
		severity: 'warning',
		status: v009Pass ? 'pass' : 'fail',
		message: v009Pass
			? ''
			: lineFails.map((l) => `Line ${l.line_no}: qty × price ≠ amount`).join('; '),
	})

	return results
}

export function decideStatus(results: CheckResult[]): 'flagged' | 'needs_review' {
	const hasBlockingFail = results.some((r) => r.status === 'fail' && r.severity === 'blocking')
	return hasBlockingFail ? 'flagged' : 'needs_review'
}

export function failedIds(results: CheckResult[], severity?: Severity): string[] {
	return results
		.filter((r) => r.status === 'fail' && (severity === undefined || r.severity === severity))
		.map((r) => r.id)
}

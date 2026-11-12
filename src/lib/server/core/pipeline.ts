import type { ExtractedInvoice, GLResult } from './schemas.ts'
import { getProvider, callAndValidate, extractionSchema, glResultSchema } from './llm/index.ts'
import { validateInvoice, decideStatus, failedIds } from './validation.ts'
import { appendAudit } from './audit.ts'
import { getConfig } from './config.ts'
import { getAdminPb } from '../pb-admin.ts'

export class PipelineError extends Error {
	statusCode: number
	constructor(message: string, statusCode: number) {
		super(message)
		this.name = 'PipelineError'
		this.statusCode = statusCode
	}
}

const AUDIT_EVENTS = {
	processing: 'processing.started',
	extractionCompleted: 'extraction.completed',
	extractionFailed: 'extraction.failed',
	validation: 'validation.completed',
	gl: 'gl.suggested',
	retry: 'invoice.retry',
} as const

async function downloadPdfBytes(pb: any, record: any): Promise<Uint8Array> {
	const token = await pb.files.getToken()
	const fileRef = Array.isArray(record.file) ? (record.file[0] as any) : record.file
	const url = pb.files.getURL(record, fileRef, { token })
	const res = await fetch(url)
	if (!res.ok) throw new Error(`Failed to download PDF: ${res.status}`)
	const ab = await res.arrayBuffer()
	return new Uint8Array(ab)
}

export async function processInvoice(id: string) {
	const config = getConfig()
	const pb = await getAdminPb()

	const record = await pb.collection('invoices').getOne(id)
	if (record.status !== 'uploaded' && record.status !== 'error') {
		throw new PipelineError(`Invoice is in ${record.status} state, cannot process`, 409)
	}

	if (record.status === 'error') {
		await appendAudit(pb, { event: AUDIT_EVENTS.retry, actor: 'system', invoice: record.id })
	}

	// 2. processing
	await pb.collection('invoices').update(id, { status: 'processing' })
	await appendAudit(pb, { event: AUDIT_EVENTS.processing, actor: 'system', invoice: record.id })

	let extracted: ExtractedInvoice
	let extractionProvider: string
	let extractionModel: string
	let extractionPromptVersion: string
	try {
		const t0 = Date.now()
		const pdf = await downloadPdfBytes(pb, record)
		const provider = getProvider()
		extractionProvider = provider.name
		const result = await callAndValidate(
			(retryNote) => provider.extractInvoice({ pdf, filename: record.original_filename ?? '' }, retryNote),
			extractionSchema,
		)
		extracted = result.data
		extractionModel = result.model
		extractionPromptVersion = result.promptVersion
		const durationMs = Date.now() - t0

		// 5. save extracted fields + lines
		await pb.collection('invoices').update(id, {
			vendor_name: extracted.vendor_name,
			invoice_number: extracted.invoice_number,
			invoice_date: extracted.invoice_date,
			due_date: extracted.due_date,
			payment_terms: extracted.payment_terms,
			po_number: extracted.po_number,
			currency: extracted.currency,
			subtotal: extracted.subtotal,
			tax: extracted.tax,
			total: extracted.total,
			extraction_json: extracted,
			extraction_provider: extractionProvider,
			extraction_model: extractionModel,
		})

		// clear existing lines then recreate
		const existingLines = await pb.collection('invoice_lines').getFullList({
			filter: pb.filter('invoice = {:id}', { id }),
		})
		for (const line of existingLines) {
			await pb.collection('invoice_lines').delete(line.id)
		}
		for (const line of extracted.line_items) {
			await pb.collection('invoice_lines').create({
				invoice: id,
				line_no: line.line_no,
				description: line.description,
				quantity: line.quantity,
				unit_price: line.unit_price,
				amount: line.amount,
				confirmed: false,
			})
		}

		await appendAudit(pb, {
			event: AUDIT_EVENTS.extractionCompleted,
			actor: `llm:${extractionProvider}`,
			invoice: record.id,
			after: {
				vendor_name: extracted.vendor_name,
				invoice_number: extracted.invoice_number,
				invoice_date: extracted.invoice_date,
				due_date: extracted.due_date,
				payment_terms: extracted.payment_terms,
				po_number: extracted.po_number,
				currency: extracted.currency,
				subtotal: extracted.subtotal,
				tax: extracted.tax,
				total: extracted.total,
				line_items: extracted.line_items,
			},
			meta: { provider: extractionProvider, model: extractionModel, promptVersion: extractionPromptVersion, durationMs },
		})
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err)
		await pb.collection('invoices').update(id, { status: 'error', error_message: message })
		await appendAudit(pb, {
			event: AUDIT_EVENTS.extractionFailed,
			actor: 'system',
			invoice: record.id,
			meta: { error: message },
		})
		return await pb.collection('invoices').getOne(id)
	}

	// 6. validation
	const purchaseOrders = await pb.collection('purchase_orders').getFullList()
	const allInvoices = await pb.collection('invoices').getFullList()
	const existingInvoices = allInvoices.filter(
		(iv: any) => iv.id !== id && iv.status !== 'error',
	)
	const validation = validateInvoice(extracted, {
		purchaseOrders: purchaseOrders as any[],
		existingInvoices: existingInvoices as any[],
		currentInvoiceId: id,
		poTolerancePct: config.PO_TOLERANCE_PCT,
	})
	await pb.collection('invoices').update(id, { validation_json: validation })
	const blocking = failedIds(validation, 'blocking')
	const warnings = failedIds(validation, 'warning')
	await appendAudit(pb, {
		event: AUDIT_EVENTS.validation,
		actor: 'system',
		invoice: record.id,
		meta: { blocking: blocking.length, warnings: warnings.length, failedIds: blocking },
	})

	// 7. GL suggestions
	const accounts = await pb.collection('gl_accounts').getFullList()
	const accountCodes = new Set(accounts.map((a: any) => a.code))
	const lines = await pb.collection('invoice_lines').getFullList({
		filter: pb.filter('invoice = {:id}', { id }),
	})
	let glModel = ''
	let glPromptVersion = ''
	let glMeta: Record<string, unknown> = {}
	let glSucceeded = true
	try {
		const provider = getProvider()
		glModel = provider.name
		const vendorName = extracted.vendor_name
		const glInput = {
			vendorName,
			lines: lines.map((l: any) => ({ line_no: l.line_no, description: l.description, amount: l.amount })),
			accounts: accounts.map((a: any) => ({ code: a.code, name: a.name })),
		}
		const result = await callAndValidate(
			(retryNote) => provider.suggestGlCodes(glInput, retryNote),
			glResultSchema,
		)
		const suggestions = result.data.suggestions
		glPromptVersion = result.promptVersion

		for (const line of lines) {
			const suggestion = suggestions.find((s: any) => s.line_no === line.line_no)
			let accountCode: string | null = null
			let confidence = 0
			let reason = ''
			if (suggestion && accountCodes.has(suggestion.account_code)) {
				accountCode = suggestion.account_code
				confidence = suggestion.confidence
				reason = suggestion.reason
			}
			const needsReview = confidence < config.GL_CONFIDENCE_THRESHOLD || accountCode === null
			await pb.collection('invoice_lines').update(line.id, {
				suggested_account_code: accountCode,
				final_account_code: accountCode,
				confidence,
				reason,
				needs_review: needsReview,
				confirmed: false,
			})
		}

		await appendAudit(pb, {
			event: AUDIT_EVENTS.gl,
			actor: `llm:${glModel}`,
			invoice: record.id,
			meta: { provider: glModel, promptVersion: glPromptVersion },
		})
	} catch (err) {
		glSucceeded = false
		const message = err instanceof Error ? err.message : String(err)
		glMeta = { error: message }
		for (const line of lines) {
			await pb.collection('invoice_lines').update(line.id, {
				suggested_account_code: null,
				final_account_code: null,
				confidence: 0,
				reason: '',
				needs_review: true,
				confirmed: false,
			})
		}
		await appendAudit(pb, {
			event: AUDIT_EVENTS.gl,
			actor: 'llm:unknown',
			invoice: record.id,
			meta: { ...glMeta, error: message },
		})
	}

	// 8. final status
	const finalStatus = blocking.length > 0 ? 'flagged' : 'needs_review'
	await pb.collection('invoices').update(id, { status: finalStatus })

	return await pb.collection('invoices').getOne(id)
}

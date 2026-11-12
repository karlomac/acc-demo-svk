import { z } from 'zod'

const lineItemSchema = z.object({
	line_no: z.number().int().min(1),
	description: z.string().min(1),
	quantity: z.number(),
	unit_price: z.number(),
	amount: z.number(),
})

export const ExtractedInvoiceSchema = z.object({
	vendor_name: z.string().min(1),
	invoice_number: z.string().min(1),
	invoice_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
	payment_terms: z.string().nullable(),
	po_number: z.string().nullable(),
	currency: z.string().length(3),
	subtotal: z.number(),
	tax: z.number(),
	total: z.number(),
	line_items: z.array(lineItemSchema).min(1),
})

export const GLLineSuggestionSchema = z.object({
	line_no: z.number().int(),
	account_code: z.string(),
	confidence: z.number().min(0).max(1),
	reason: z.string(),
})

export const GLResultSchema = z.object({
	suggestions: z.array(GLLineSuggestionSchema),
})

export type ExtractedInvoice = z.infer<typeof ExtractedInvoiceSchema>
export type GLResult = z.infer<typeof GLResultSchema>
export type GLLineSuggestion = z.infer<typeof GLLineSuggestionSchema>

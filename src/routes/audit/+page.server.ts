import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	const pb = locals.pb

	const records = await pb.collection('audit_log').getFullList({ sort: '-seq', limit: 200 })

	// Enrich with invoice number where available
	const enriched = await Promise.all(
		records.map(async (r: any) => {
			let invoiceNumber: string | null = null
			if (r.invoice) {
				try {
					const inv = await pb.collection('invoices').getOne(r.invoice)
					invoiceNumber = inv.invoice_number ?? null
				} catch {
					invoiceNumber = null
				}
			}
			return {
				...r,
				invoice_number: invoiceNumber
			}
		})
	)

	return { audit: enriched }
}

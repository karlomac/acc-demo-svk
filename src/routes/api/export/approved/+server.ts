import type { RequestHandler } from './$types'
import { getAdminPb } from '../../../../lib/server/pb-admin'

const COLUMNS = [
	'invoice_number',
	'vendor_name',
	'po_number',
	'currency',
	'subtotal',
	'tax',
	'total',
	'reviewed_by',
	'reviewed_at',
	'reviewer_note',
] as const

function cell(value: unknown) {
	const text = value == null ? '' : String(value)
	return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export const GET: RequestHandler = async () => {
	const pb = await getAdminPb()
	const invoices = await pb.collection('invoices').getFullList({
		filter: 'status = "approved"',
		sort: '-reviewed_at',
	})
	const rows = invoices.filter((i: any) => !i.deleted_at)
	const csv = [
		COLUMNS.join(','),
		...rows.map((i: any) => COLUMNS.map((c) => cell(i[c])).join(',')),
	].join('\n')

	return new Response(csv + '\n', {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': 'attachment; filename="approved-invoices.csv"',
		},
	})
}

import type { Actions, PageServerLoad } from './$types'
import { fail, redirect } from '@sveltejs/kit'
import { getAdminPb } from '../../../lib/server/pb-admin'
import { appendAudit } from '../../../lib/server/core/audit'

export const load: PageServerLoad = async ({ params, locals }) => {
	const pb = locals.pb

	const invoice = await pb.collection('invoices').getOne(params.id)
	const lines = await pb.collection('invoice_lines').getFullList({
		filter: pb.filter('invoice = {:id}', { id: params.id }),
		sort: 'line_no',
	})
	const audit = await pb.collection('audit_log').getFullList({
		filter: pb.filter('invoice = {:id}', { id: params.id }),
		sort: '-seq',
	})

	let po: any = null
	if (invoice.po_number) {
		try {
			po = await pb.collection('purchase_orders').getFirstListItem(
				pb.filter('po_number = {:n}', { n: invoice.po_number })
			)
		} catch {
			po = null
		}
	}

	return { invoice, lines, audit, po }
}

export const actions: Actions = {
	approve: async ({ request, params, locals }) => {
		const pb = await getAdminPb()
		const formData = await request.formData()
		const note = (formData.get('note') as string) ?? ''

		const before = await pb.collection('invoices').getOne(params.id)
		await pb.collection('invoices').update(params.id, {
			status: 'approved',
			reviewer_note: note || null,
			reviewed_by: locals.user?.email ?? 'system',
			reviewed_at: new Date().toISOString(),
		})
		await appendAudit(pb, {
			event: 'invoice.approved',
			actor: `user:${locals.user?.email ?? 'system'}`,
			invoice: params.id,
			before: { status: before.status },
			after: { status: 'approved', reviewer_note: note || null },
		})
		return { ok: true }
	},

	reject: async ({ request, params, locals }) => {
		const pb = await getAdminPb()
		const formData = await request.formData()
		const note = (formData.get('note') as string) ?? ''

		const before = await pb.collection('invoices').getOne(params.id)
		await pb.collection('invoices').update(params.id, {
			status: 'rejected',
			reviewer_note: note || null,
			reviewed_by: locals.user?.email ?? 'system',
			reviewed_at: new Date().toISOString(),
		})
		await appendAudit(pb, {
			event: 'invoice.rejected',
			actor: `user:${locals.user?.email ?? 'system'}`,
			invoice: params.id,
			before: { status: before.status },
			after: { status: 'rejected', reviewer_note: note || null },
		})
		return { ok: true }
	},

	update_line: async ({ request, params, locals }) => {
		const pb = await getAdminPb()
		const formData = await request.formData()
		const lineId = formData.get('line_id') as string
		const accountCode = (formData.get('account_code') as string) || null
		const confirmed = formData.get('confirmed') === 'true'
		const needsReview = formData.get('needs_review') === 'true'

		const line = await pb.collection('invoice_lines').getOne(lineId)
		if (line.invoice !== params.id) {
			return fail(400, { error: 'Line does not belong to this invoice' })
		}

		await pb.collection('invoice_lines').update(lineId, {
			final_account_code: accountCode,
			confirmed,
			needs_review: needsReview,
		})
		await appendAudit(pb, {
			event: 'invoice_line.updated',
			actor: `user:${locals.user?.email ?? 'system'}`,
			invoice: params.id,
			before: { line_id: lineId, account_code: line.final_account_code, confirmed: line.confirmed, needs_review: line.needs_review },
			after: { line_id: lineId, account_code: accountCode, confirmed, needs_review: needsReview },
		})
		return { ok: true }
	},
}

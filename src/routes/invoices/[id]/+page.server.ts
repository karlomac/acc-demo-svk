import type { Actions, PageServerLoad } from './$types'
import { fail, redirect } from '@sveltejs/kit'
import { getAdminPb } from '../../../lib/server/pb-admin'
import { appendAudit } from '../../../lib/server/core/audit'
import { isReviewable } from '../../../lib/status'
import { claimDecision, DecisionConflict, releaseDecision } from '../../../lib/server/core/decisions'

export const load: PageServerLoad = async ({ params, locals }) => {
	const pb = locals.pb

	const invoice = await pb.collection('invoices').getOne(params.id)
	if (invoice.deleted_at) throw redirect(303, '/queue')
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
		if (before.deleted_at) return fail(400, { error: 'This invoice has been deleted.' })
		if (!isReviewable(before.status)) {
			return fail(400, { error: `Cannot approve an invoice in "${before.status}" state.` })
		}
		if (formData.get('gaap') !== 'true') {
			return fail(400, { error: 'Confirm the GAAP / purchase-order review checkbox before approving.' })
		}
		const actor = locals.user?.email ?? 'system'
		let claim: any
		try {
			claim = await claimDecision(pb, params.id, 'approve', actor, note)
		} catch (err) {
			if (err instanceof DecisionConflict) {
				return fail(409, {
					error: `Already decided by ${err.existing.actor} (${err.existing.action}) at ${err.existing.decided_at}.`,
				})
			}
			throw err
		}
		try {
			await pb.collection('invoices').update(params.id, {
				status: 'approved',
				reviewer_note: note || null,
				reviewed_by: actor,
				reviewed_at: new Date().toISOString(),
			})
			await appendAudit(pb, {
				event: 'invoice.approved',
				actor: `user:${actor}`,
				invoice: params.id,
				before: { status: before.status },
				after: { status: 'approved', reviewer_note: note || null },
			})
		} catch (err) {
			await releaseDecision(pb, claim.id)
			throw err
		}
		return { ok: true }
	},

	reject: async ({ request, params, locals }) => {
		const pb = await getAdminPb()
		const formData = await request.formData()
		const note = (formData.get('note') as string) ?? ''

		const before = await pb.collection('invoices').getOne(params.id)
		if (before.deleted_at) return fail(400, { error: 'This invoice has been deleted.' })
		if (!isReviewable(before.status)) {
			return fail(400, { error: `Cannot reject an invoice in "${before.status}" state.` })
		}
		const actor = locals.user?.email ?? 'system'
		let claim: any
		try {
			claim = await claimDecision(pb, params.id, 'reject', actor, note)
		} catch (err) {
			if (err instanceof DecisionConflict) {
				return fail(409, {
					error: `Already decided by ${err.existing.actor} (${err.existing.action}) at ${err.existing.decided_at}.`,
				})
			}
			throw err
		}
		try {
			await pb.collection('invoices').update(params.id, {
				status: 'rejected',
				reviewer_note: note || null,
				reviewed_by: actor,
				reviewed_at: new Date().toISOString(),
			})
			await appendAudit(pb, {
				event: 'invoice.rejected',
				actor: `user:${actor}`,
				invoice: params.id,
				before: { status: before.status },
				after: { status: 'rejected', reviewer_note: note || null },
			})
		} catch (err) {
			await releaseDecision(pb, claim.id)
			throw err
		}
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

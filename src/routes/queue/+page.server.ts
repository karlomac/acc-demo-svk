import type { Actions, PageServerLoad } from './$types'
import { fail } from '@sveltejs/kit'
import { getAdminPb } from '../../lib/server/pb-admin'
import { appendAudit } from '../../lib/server/core/audit'
import { batchSkipReason } from '../../lib/status'
import { claimDecision, DecisionConflict, releaseDecision } from '../../lib/server/core/decisions'

const MAX_FILES = 20
const MAX_SIZE = 10 * 1024 * 1024

export const load: PageServerLoad = async ({ locals }) => {
	const invoices = await locals.pb.collection('invoices').getFullList({ sort: '-created' })
	return { invoices: invoices.filter((i: any) => !i.deleted_at) }
}

export const actions: Actions = {
	upload: async ({ request, locals }) => {
		const pb = await getAdminPb()
		const formData = await request.formData()
		const files = formData.getAll('files')
		if (files.length === 0) return fail(400, { errors: [{ name: '', error: 'No files selected' }] })
		if (files.length > MAX_FILES) {
			return fail(400, { errors: [{ name: '', error: `Maximum ${MAX_FILES} files per request` }] })
		}

		const ids: string[] = []
		const errors: Array<{ name: string; error: string }> = []

		for (const raw of files) {
			if (!(raw instanceof File)) continue
			const file = raw
			let ok = true
			let error = ''
			if (file.type !== 'application/pdf') {
				ok = false
				error = 'Not a PDF file'
			} else if (file.size > MAX_SIZE) {
				ok = false
				error = 'File exceeds 10 MB'
			} else {
				const header = await file.slice(0, 4).arrayBuffer()
				const magic = String.fromCharCode(...new Uint8Array(header))
				if (magic !== '%PDF') {
					ok = false
					error = 'Not a valid PDF'
				}
			}
			if (!ok) {
				errors.push({ name: file.name, error })
				continue
			}
			const bytes = await file.arrayBuffer()
			const record = await pb.collection('invoices').create({
				file: new File([bytes], file.name, { type: 'application/pdf' }),
				original_filename: file.name,
				status: 'uploaded',
			})
			await appendAudit(pb, {
				event: 'invoice.uploaded',
				actor: `user:${locals.user?.email ?? 'unknown'}`,
				invoice: record.id,
			})
			ids.push(record.id)
		}

		return { ids, errors }
	},

	batch: async ({ request, locals }) => {
		const pb = await getAdminPb()
		const formData = await request.formData()
		const action = String(formData.get('action') ?? '')
		const ids = formData.getAll('ids').map(String).filter(Boolean)
		if (action !== 'approve' && action !== 'flag') {
			return fail(400, { errors: [{ name: '', error: 'Unknown batch action' }] })
		}
		if (ids.length === 0) {
			return fail(400, { errors: [{ name: '', error: 'No invoices selected' }] })
		}

		const status = action === 'approve' ? 'approved' : 'flagged'
		let updated = 0
		const skipped: Array<{ id: string; reason: string }> = []
		for (const id of ids) {
			const before = await pb.collection('invoices').getOne(id)
			if (before.deleted_at) {
				skipped.push({ id, reason: 'invoice is deleted' })
				continue
			}
			const reason = batchSkipReason(action, before.status)
			if (reason) {
				skipped.push({ id, reason })
				continue
			}
			let claim: any
			try {
				claim = await claimDecision(pb, id, action, locals.user?.email ?? 'unknown')
			} catch (err) {
				if (err instanceof DecisionConflict) {
					skipped.push({ id, reason: 'already decided' })
					continue
				}
				throw err
			}
			try {
				await pb.collection('invoices').update(id, { status })
				await appendAudit(pb, {
					event: action === 'approve' ? 'invoice.approved' : 'invoice.flagged',
					actor: `user:${locals.user?.email ?? 'unknown'}`,
					invoice: id,
					before: { status: before.status },
					after: { status },
				})
			} catch (err) {
				await releaseDecision(pb, claim.id)
				skipped.push({ id, reason: 'update failed' })
				continue
			}
			// A flag is not final: release the claim so the invoice can be decided later.
			if (action === 'flag') await releaseDecision(pb, claim.id)
			updated++
		}
		if (updated === 0) {
			return fail(400, { error: 'No invoices were updated', skipped })
		}
		return { ok: true, updated, skipped }
	},

	delete: async ({ request, locals }) => {
		const pb = await getAdminPb()
		const formData = await request.formData()
		const id = String(formData.get('id') ?? '')
		if (!id) return fail(400, { errors: [{ name: '', error: 'Missing invoice id' }] })

		const before = await pb.collection('invoices').getOne(id)
		const deletedAt = new Date().toISOString()
		await pb.collection('invoices').update(id, { deleted_at: deletedAt })
		await appendAudit(pb, {
			event: 'invoice.deleted',
			actor: `user:${locals.user?.email ?? 'unknown'}`,
			invoice: id,
			before: { status: before.status, deleted_at: before.deleted_at ?? null },
			after: { deleted_at: deletedAt },
		})
		return { ok: true, deleted: id }
	},
}

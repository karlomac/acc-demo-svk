import type { Actions, PageServerLoad } from './$types'
import { fail } from '@sveltejs/kit'
import { getAdminPb } from '../lib/server/pb-admin'
import { appendAudit } from '../lib/server/core/audit'

const MAX_FILES = 20
const MAX_SIZE = 10 * 1024 * 1024

export const load: PageServerLoad = async ({ locals }) => {
	const invoices = await locals.pb.collection('invoices').getFullList({ sort: '-created' })
	return { invoices }
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
}

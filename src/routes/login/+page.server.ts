import type { Actions, PageServerLoad } from './$types'
import { fail, redirect } from '@sveltejs/kit'
import { getConfig } from '../../lib/server/core/config'

const config = getConfig()

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(303, '/')
	}
	return { showDemoHint: config.LLM_PROVIDER === 'mock' }
}

export const actions: Actions = {
	login: async ({ request, locals }) => {
		const data = await request.formData()
		const email = String(data.get('email') ?? '')
		const password = String(data.get('password') ?? '')
		try {
			await locals.pb.collection('users').authWithPassword(email, password)
		} catch {
			return fail(400, { message: 'Invalid email or password', email })
		}
		throw redirect(303, '/')
	},
	logout: async ({ locals }) => {
		locals.pb.authStore.clear()
		throw redirect(303, '/login')
	},
}

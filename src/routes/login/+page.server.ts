import type { Actions, PageServerLoad } from './$types'
import { fail, redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(303, '/queue')
	}
	return { demoEmail: process.env.DEMO_USER_EMAIL ?? '' }
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
		throw redirect(303, '/queue')
	},
	demo: async ({ locals }) => {
		const email = process.env.DEMO_USER_EMAIL
		const password = process.env.DEMO_USER_PASSWORD
		if (!email || !password) {
			return fail(500, { message: 'Demo credentials are not configured' })
		}
		try {
			await locals.pb.collection('users').authWithPassword(email, password)
		} catch {
			return fail(400, { message: 'Demo account unavailable' })
		}
		throw redirect(303, '/queue')
	},
	logout: async ({ locals }) => {
		locals.pb.authStore.clear()
		throw redirect(303, '/login')
	},
}

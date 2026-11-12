import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(303, '/queue')
	return { demoEmail: process.env.DEMO_USER_EMAIL ?? '' }
}

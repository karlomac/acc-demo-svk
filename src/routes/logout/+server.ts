import type { RequestHandler } from './$types'
import { redirect } from '@sveltejs/kit'

export const POST: RequestHandler = async ({ locals, cookies }) => {
	locals.pb.authStore.clear()
	cookies.delete('pb_auth', { path: '/' })
	throw redirect(303, '/login')
}

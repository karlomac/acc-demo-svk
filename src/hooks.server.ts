import { redirect, type RequestEvent } from '@sveltejs/kit'
import PocketBase from 'pocketbase'

const PB_URL = import.meta.env.POCKETBASE_URL ?? 'http://127.0.0.1:8090'

type Resolve = (event: RequestEvent) => Promise<Response>

export const handle = async ({ event, resolve }: { event: RequestEvent; resolve: Resolve }): Promise<Response> => {
	event.locals.pb = new PocketBase(PB_URL)
	event.locals.pb.authStore.loadFromCookie(event.request.headers.get('cookie') ?? '')
	event.locals.user = null

	if (event.locals.pb.authStore.isValid) {
		try {
			await event.locals.pb.collection('users').authRefresh()
			event.locals.user = event.locals.pb.authStore.model as { id: string; email: string }
		} catch {
			event.locals.pb.authStore.clear()
		}
	}

	if (!event.locals.user && event.url.pathname !== '/login') {
		throw redirect(303, '/login')
	}

	const response = await resolve(event)

	const cookie = event.locals.pb.authStore.exportToCookie({
		httpOnly: true,
		sameSite: 'Lax',
		secure: PB_URL.startsWith('https'),
		path: '/',
	})
	if (cookie) {
		response.headers.append('set-cookie', cookie)
	}

	return response
}

import { redirect, type RequestEvent } from '@sveltejs/kit'
import PocketBase from 'pocketbase'

type Resolve = (event: RequestEvent) => Promise<Response>

const PUBLIC_PATHS = new Set(['/login', '/health'])

export const handle = async ({ event, resolve }: { event: RequestEvent; resolve: Resolve }): Promise<Response> => {
	const pbUrl = process.env.POCKETBASE_URL ?? 'http://127.0.0.1:8090'
	event.locals.pb = new PocketBase(pbUrl)
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

	if (!event.locals.user && !PUBLIC_PATHS.has(event.url.pathname)) {
		throw redirect(303, '/login')
	}

	const response = await resolve(event)

	const cookie = event.locals.pb.authStore.exportToCookie({
		httpOnly: true,
		sameSite: 'Lax',
		secure: pbUrl.startsWith('https'),
		path: '/',
	})
	if (cookie) {
		response.headers.append('set-cookie', cookie)
	}

	return response
}

import type { RequestHandler } from './$types'
import { processInvoice, PipelineError } from '../../../../../lib/server/core/pipeline'

export const POST: RequestHandler = async ({ params }) => {
	try {
		const invoice = await processInvoice(params.id as string)
		return new Response(JSON.stringify({ id: invoice.id, status: invoice.status }), {
			status: 200,
			headers: { 'content-type': 'application/json' },
		})
	} catch (err) {
		if (err instanceof PipelineError) {
			return new Response(JSON.stringify({ error: err.message }), {
				status: err.statusCode,
				headers: { 'content-type': 'application/json' },
			})
		}
		return new Response(JSON.stringify({ error: 'Processing failed' }), {
			status: 500,
			headers: { 'content-type': 'application/json' },
		})
	}
}

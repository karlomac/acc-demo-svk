import { getConfig } from '../config.ts'
import { parseJsonLoose } from './json.ts'
import { EXTRACT_SYSTEM_PROMPT, GL_SYSTEM_PROMPT } from './prompts.ts'
import type { LlmProvider } from './types'

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

function base64(pdf: Uint8Array): string {
	return Buffer.from(pdf).toString('base64')
}

async function anthropicRequest(body: unknown): Promise<string> {
	const config = getConfig()
	const signal = AbortSignal.timeout(60000)
	const res = await fetch(ANTHROPIC_API, {
		method: 'POST',
		signal,
		headers: {
			'x-api-key': config.ANTHROPIC_API_KEY,
			'anthropic-version': '2023-06-01',
			'content-type': 'application/json',
		},
		body: JSON.stringify(body),
	})
	let bodyText = ''
	try {
		bodyText = await res.text()
	} catch {}
	if (!res.ok) {
		throw new Error(`Anthropic API error ${res.status}: ${bodyText}`)
	}
	const data = JSON.parse(bodyText)
	return typeof data.content?.[0]?.text === 'string' ? data.content[0].text : ''
}

export class AnthropicProvider implements LlmProvider {
	name = 'anthropic' as const

	async extractInvoice(input: { pdf: Uint8Array; filename: string }, retryNote?: string) {
		const userContent: Array<{ type: string; text?: string; source?: { type: string; media_type: string; data: string } }> = [
			{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64(input.pdf) } },
			{ type: 'text', text: 'Extract the invoice data.' },
		]
		if (retryNote) {
			userContent.push({ type: 'text', text: retryNote })
		}
		const text = await anthropicRequest({
			model: getConfig().LLM_MODEL,
			max_tokens: 2000,
			temperature: 0,
			system: EXTRACT_SYSTEM_PROMPT,
			messages: [{ role: 'user', content: userContent }],
		})
		return { data: parseJsonLoose(text), model: getConfig().LLM_MODEL, promptVersion: 'extract-v1' }
	}

	async suggestGlCodes(input: { vendorName: string; lines: Array<{ line_no: number; description: string; amount: number }>; accounts: Array<{ code: string; name: string }> }, retryNote?: string) {
		let userText = JSON.stringify({ vendor_name: input.vendorName, lines: input.lines, accounts: input.accounts })
		if (retryNote) {
			userText += '\n' + retryNote
		}
		const text = await anthropicRequest({
			model: getConfig().LLM_MODEL,
			max_tokens: 2000,
			temperature: 0,
			system: GL_SYSTEM_PROMPT,
			messages: [{ role: 'user', content: userText }],
		})
		return { data: parseJsonLoose(text), model: getConfig().LLM_MODEL, promptVersion: 'gl-v1' }
	}
}

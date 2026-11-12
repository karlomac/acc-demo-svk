import { getConfig } from '../config.ts'
import { parseJsonLoose } from './json.ts'
import { EXTRACT_SYSTEM_PROMPT, GL_SYSTEM_PROMPT } from './prompts.ts'
import type { LlmProvider } from './types'
import { getDocumentProxy, extractText } from 'unpdf'

async function pdfToText(pdf: Uint8Array): Promise<string> {
	const doc = await getDocumentProxy(pdf)
	const { text } = await extractText(doc, { mergePages: true })
	return text
}

async function openaiRequest(body: unknown): Promise<string> {
	const config = getConfig()
	if (!config.OPENAI_COMPAT_BASE_URL) {
		throw new Error('OPENAI_COMPAT_BASE_URL is not configured')
	}
	const signal = AbortSignal.timeout(60000)
	const res = await fetch(`${config.OPENAI_COMPAT_BASE_URL}/chat/completions`, {
		method: 'POST',
		signal,
		headers: {
			Authorization: `Bearer ${config.OPENAI_COMPAT_API_KEY}`,
			'content-type': 'application/json',
		},
		body: JSON.stringify(body),
	})
	let bodyText = ''
	try {
		bodyText = await res.text()
	} catch {}
	if (!res.ok) {
		throw new Error(`OpenAI-compatible API error ${res.status}: ${bodyText}`)
	}
	const data = JSON.parse(bodyText)
	return typeof data.choices?.[0]?.message?.content === 'string' ? data.choices[0].message.content : ''
}

export class OpenAICompatibleProvider implements LlmProvider {
	name = 'openai_compatible' as const

	async extractInvoice(input: { pdf: Uint8Array; filename: string }, retryNote?: string) {
		const text = await pdfToText(input.pdf)
		let userText = 'Extract the invoice data.\n' + text
		if (retryNote) {
			userText += '\n' + retryNote
		}
		const reply = await openaiRequest({
			model: getConfig().LLM_MODEL,
			temperature: 0,
			messages: [
				{ role: 'system', content: EXTRACT_SYSTEM_PROMPT },
				{ role: 'user', content: userText },
			],
		})
		return { data: parseJsonLoose(reply), model: getConfig().LLM_MODEL, promptVersion: 'extract-v1' }
	}

	async suggestGlCodes(input: { vendorName: string; lines: Array<{ line_no: number; description: string; amount: number }>; accounts: Array<{ code: string; name: string }> }, retryNote?: string) {
		let userText = JSON.stringify({ vendor_name: input.vendorName, lines: input.lines, accounts: input.accounts })
		if (retryNote) {
			userText += '\n' + retryNote
		}
		const reply = await openaiRequest({
			model: getConfig().LLM_MODEL,
			temperature: 0,
			messages: [
				{ role: 'system', content: GL_SYSTEM_PROMPT },
				{ role: 'user', content: userText },
			],
		})
		return { data: parseJsonLoose(reply), model: getConfig().LLM_MODEL, promptVersion: 'gl-v1' }
	}
}

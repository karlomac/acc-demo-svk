import { z } from 'zod'
import type { LlmProvider } from './types'
import { LlmFormatError } from './types'
import { AnthropicProvider } from './anthropic'
import { OpenAICompatibleProvider } from './openai-compatible'
import { MockProvider } from './mock'
import { ExtractedInvoiceSchema, GLResultSchema } from '../schemas'
import { getConfig } from '../config'

export function getProvider(): LlmProvider {
	switch (getConfig().LLM_PROVIDER) {
		case 'anthropic':
			return new AnthropicProvider()
		case 'openai_compatible':
			return new OpenAICompatibleProvider()
		case 'mock':
		default:
			return new MockProvider()
	}
}

export async function callAndValidate<T>(
	fn: (retryNote?: string) => Promise<{ data: unknown; model: string; promptVersion: string }>,
	schema: z.ZodSchema<T>,
): Promise<{ data: T; model: string; promptVersion: string }> {
	let lastError: unknown
	for (let attempt = 0; attempt < 2; attempt++) {
		const result = await fn(attempt > 0 ? String(lastError) : undefined)
		try {
			const data = schema.parse(result.data)
			return { data, model: result.model, promptVersion: result.promptVersion }
		} catch (err) {
			lastError = err
		}
	}
	throw new LlmFormatError(`LLM returned invalid output after 2 attempts: ${lastError}`)
}

export const extractionSchema = ExtractedInvoiceSchema
export const glResultSchema = GLResultSchema

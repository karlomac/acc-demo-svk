export type LlmProviderName = 'mock' | 'anthropic' | 'openai_compatible'

export interface LlmProvider {
	name: LlmProviderName
	extractInvoice(
		input: { pdf: Uint8Array; filename: string },
		retryNote?: string,
	): Promise<{ data: unknown; model: string; promptVersion: string }>
	suggestGlCodes(
		input: {
			vendorName: string
			lines: { line_no: number; description: string; amount: number }[]
			accounts: { code: string; name: string }[]
		},
		retryNote?: string,
	): Promise<{ data: unknown; model: string; promptVersion: string }>
}

export class LlmFormatError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'LlmFormatError'
	}
}

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { LlmProvider } from './types'

const EXPECTED_DIR = join(process.cwd(), 'data', 'sample', 'expected')

function keyFromFilename(filename: string): string {
	let key = filename.replace(/\.[^./]+$/, '')
	// Strip PocketBase's random stored-file suffix, e.g. `_AbC123xyz0`
	key = key.replace(/_[A-Za-z0-9]{6,}$/, '')
	return key
}

const GL_RULES: Array<{ re: RegExp; code: string; confidence: number; reason: string }> = [
	{ re: /paper|toner|\bpens?\b|supplies/i, code: '5000', confidence: 0.95, reason: 'Office consumables' },
	{ re: /cleaning|janitorial|window|carpet/i, code: '5100', confidence: 0.93, reason: 'Cleaning service' },
	{ re: /it support|backup|patching|cloud|software|subscription|managed/i, code: '5200', confidence: 0.94, reason: 'IT service or software' },
	{ re: /contract review|filing fees|legal|attorney/i, code: '5300', confidence: 0.92, reason: 'Legal or professional fee' },
	{ re: /lawn|shrub|mulch|landscap/i, code: '5400', confidence: 0.94, reason: 'Grounds maintenance' },
	{ re: /freight|shipment|shipping|liftgate|fuel surcharge/i, code: '5500', confidence: 0.93, reason: 'Shipping cost' },
	{ re: /electricity|demand charge|utility/i, code: '5700', confidence: 0.92, reason: 'Utility charge' },
	{ re: /internet|static ip|installation|telecom/i, code: '6100', confidence: 0.90, reason: 'Telecom or internet' },
	{ re: /rental|excavator/i, code: '6200', confidence: 0.70, reason: 'Could be rental, repair, or asset' },
	{ re: /delivery|pickup/i, code: '5500', confidence: 0.60, reason: 'Delivery; account unclear' },
	{ re: /waiver/i, code: '5800', confidence: 0.55, reason: 'Possibly insurance; unclear' },
	{ re: /operator/i, code: '5600', confidence: 0.55, reason: 'Labor type unclear' },
	{ re: /\bads\b|advertising|social media|campaign|flyers/i, code: '6000', confidence: 0.93, reason: 'Marketing spend' },
	{ re: /trade show/i, code: '5900', confidence: 0.65, reason: 'Marketing or travel; unclear' },
]

export class MockProvider implements LlmProvider {
	name = 'mock' as const

	async extractInvoice(input: { pdf: Uint8Array; filename: string }) {
		const key = keyFromFilename(input.filename)
		let json: unknown
		try {
			json = JSON.parse(readFileSync(join(EXPECTED_DIR, `${key}.json`), 'utf8'))
		} catch {
			throw new Error('Mock provider only supports the sample invoices')
		}
		return { data: json, model: 'mock', promptVersion: 'mock-v1' }
	}

	async suggestGlCodes(input: { vendorName: string; lines: Array<{ line_no: number; description: string; amount: number }>; accounts: Array<{ code: string; name: string }> }) {
		const suggestions = input.lines.map((line) => {
			const desc = line.description.toLowerCase()
			const match = GL_RULES.find((r) => r.re.test(desc))
			if (!match) {
				return { line_no: line.line_no, account_code: '5600', confidence: 0.40, reason: 'No keyword match' }
			}
			return { line_no: line.line_no, account_code: match.code, confidence: match.confidence, reason: match.reason }
		})
		return { data: { suggestions }, model: 'mock', promptVersion: 'mock-v1' }
	}
}

export function parseJsonLoose(text: string): unknown {
	let cleaned = text.trim()
	// Strip fenced code blocks (```json ... ``` or ``` ... ```)
	cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').replace(/^```\s*/gi, '')
	const start = cleaned.indexOf('{')
	const end = cleaned.lastIndexOf('}')
	if (start === -1 || end === -1 || end < start) {
		throw new Error('No JSON object found in LLM response')
	}
	return JSON.parse(cleaned.slice(start, end + 1))
}

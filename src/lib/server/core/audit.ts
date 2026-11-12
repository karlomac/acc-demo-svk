import { createHash } from 'node:crypto'

const GENESIS_HASH = '0'.repeat(64)

export interface AuditEntry {
	seq?: number
	ts?: string
	event: string
	actor: string
	invoice?: string | null
	before?: unknown
	after?: unknown
	meta?: unknown
	prev_hash?: string
	hash?: string
}

export interface ChainVerifyResult {
	ok: boolean
	count: number
	brokenAtSeq?: number
	reason?: string
}

function sha256Hex(input: string): string {
	return createHash('sha256').update(input).digest('hex')
}

export function canonicalJson(value: unknown): string {
	if (value === undefined || value === null) return 'null'
	if (typeof value === 'boolean') return value ? 'true' : 'false'
	if (typeof value === 'number') return JSON.stringify(value)
	if (typeof value === 'string') return JSON.stringify(value)
	if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']'
	if (typeof value === 'object') {
		const keys = Object.keys(value).sort()
		return (
			'{' +
			keys
				.map((k) => JSON.stringify(k) + ':' + canonicalJson((value as Record<string, unknown>)[k]))
				.join(',') +
			'}'
		)
	}
	return String(value)
}

function entryPayload(entry: AuditEntry) {
	return {
		seq: entry.seq,
		ts: entry.ts,
		event: entry.event,
		actor: entry.actor,
		invoice: entry.invoice ?? null,
		before: entry.before ?? null,
		after: entry.after ?? null,
		meta: entry.meta ?? null,
	}
}

export function computeHash(prevHash: string, entry: AuditEntry): string {
	return sha256Hex(prevHash + '|' + canonicalJson(entryPayload(entry)))
}

export function verifyChain(entries: AuditEntry[]): ChainVerifyResult {
	const sorted = [...entries].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0))
	let prevHash = GENESIS_HASH
	let expectedSeq = 1
	for (const entry of sorted) {
		if (entry.seq !== expectedSeq) {
			return { ok: false, count: sorted.length, brokenAtSeq: expectedSeq, reason: `seq gap at ${expectedSeq}` }
		}
		if (entry.prev_hash !== prevHash) {
			return { ok: false, count: sorted.length, brokenAtSeq: entry.seq, reason: `prev_hash mismatch at ${entry.seq}` }
		}
		const hash = computeHash(prevHash, entry)
		if (entry.hash !== hash) {
			return { ok: false, count: sorted.length, brokenAtSeq: entry.seq, reason: `hash mismatch at ${entry.seq}` }
		}
		prevHash = entry.hash
		expectedSeq++
	}
	return { ok: true, count: sorted.length }
}

let appendQueue = Promise.resolve()

export async function appendAudit(pb: any, entry: AuditEntry) {
	appendQueue = appendQueue.then(async () => {
		const records = await pb.collection('audit_log').getFullList({ sort: '-seq', limit: 1 })
		const last = records[0]
		const seq = last ? (last.seq as number) + 1 : 1
		const prevHash = last ? (last.hash as string) : GENESIS_HASH
		const ts = new Date().toISOString()
		const hash = computeHash(prevHash, { ...entry, seq, ts, prev_hash: prevHash })
		return await pb.collection('audit_log').create({
			seq,
			ts,
			event: entry.event,
			actor: entry.actor,
			invoice: entry.invoice ?? null,
			before: entry.before ?? null,
			after: entry.after ?? null,
			meta: entry.meta ?? null,
			prev_hash: prevHash,
			hash,
		})
	})
	return appendQueue
}

export async function verifyAudit(pb: any): Promise<ChainVerifyResult> {
	const records = await pb.collection('audit_log').getFullList({ sort: 'seq' })
	const entries = records.map((r: any) => ({
		seq: r.seq,
		ts: r.ts,
		event: r.event,
		actor: r.actor,
		invoice: r.invoice,
		before: r.before,
		after: r.after,
		meta: r.meta,
		prev_hash: r.prev_hash,
		hash: r.hash,
	}))
	return verifyChain(entries)
}

export { GENESIS_HASH }

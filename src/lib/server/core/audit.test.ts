import { describe, expect, it } from 'vitest'
import { verifyChain, canonicalJson, computeHash, GENESIS_HASH, type AuditEntry } from './audit.ts'

function buildChain(count: number) {
	const entries: AuditEntry[] = []
	let prev = GENESIS_HASH
	for (let i = 1; i <= count; i++) {
		const entry: AuditEntry = {
			seq: i,
			ts: `2026-01-${String(i).padStart(2, '0')}T00:00:00Z`,
			event: 'invoice.uploaded',
			actor: 'system',
			invoice: null,
			before: null,
			after: null,
			meta: null,
			prev_hash: prev,
		}
		entry.hash = computeHash(prev, entry)
		prev = entry.hash
		entries.push(entry)
	}
	return entries
}

describe('canonicalJson', () => {
	it('ignores key order at every depth', () => {
		const a = canonicalJson({ b: 1, a: { d: 4, c: 3 } })
		const b = canonicalJson({ a: { c: 3, d: 4 }, b: 1 })
		expect(a).toBe(b)
	})
	it('treats undefined as null', () => {
		expect(canonicalJson({ a: undefined })).toBe(canonicalJson({ a: null }))
	})
	it('produces no whitespace', () => {
		expect(canonicalJson({ a: 1, b: [2, 3] })).toBe('{"a":1,"b":[2,3]}')
	})
})

describe('verifyChain', () => {
	it('verifies a chain of 5 entries', () => {
		const chain = buildChain(5)
		expect(verifyChain(chain)).toEqual({ ok: true, count: 5 })
	})
	it('fails at the right seq when an after value changes', () => {
		const chain = buildChain(5)
		chain[2].after = { changed: true }
		const result = verifyChain(chain)
		expect(result.ok).toBe(false)
		expect(result.brokenAtSeq).toBe(3)
	})
	it('fails when a middle entry is removed', () => {
		const chain = buildChain(5)
		chain.splice(2, 1)
		const result = verifyChain(chain)
		expect(result.ok).toBe(false)
		expect(result.brokenAtSeq).toBe(3)
	})
	it('fails when genesis prev_hash is wrong', () => {
		const chain = buildChain(3)
		chain[0].prev_hash = '1'.repeat(64)
		const result = verifyChain(chain)
		expect(result.ok).toBe(false)
		expect(result.brokenAtSeq).toBe(1)
	})
})

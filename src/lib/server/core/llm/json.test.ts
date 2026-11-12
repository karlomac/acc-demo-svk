import { describe, expect, it } from 'vitest'
import { parseJsonLoose } from './json.ts'

describe('parseJsonLoose', () => {
	it('parses plain JSON', () => {
		expect(parseJsonLoose('{"a":1,"b":2}')).toEqual({ a: 1, b: 2 })
	})
	it('strips markdown fences', () => {
		expect(parseJsonLoose('```json\n{"a":1}\n```')).toEqual({ a: 1 })
		expect(parseJsonLoose('```\n{"a":1}\n```')).toEqual({ a: 1 })
	})
	it('extracts JSON surrounded by text', () => {
		expect(parseJsonLoose('Here is the result: {"a":1} end.')).toEqual({ a: 1 })
	})
	it('takes first { to last }', () => {
		expect(() => parseJsonLoose('prefix {"a":1} suffix {"b":2}')).toThrow()
	})
	it('throws on no object', () => {
		expect(() => parseJsonLoose('not json at all')).toThrow()
		expect(() => parseJsonLoose('[1,2,3]')).toThrow()
	})
})

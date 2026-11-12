export function toCents(amount: number): number {
	return Math.round(amount * 100)
}

export function fromCents(cents: number): number {
	return cents / 100
}

export function sumCents(amounts: number[]): number {
	return amounts.reduce((total, amount) => total + Math.round(amount * 100), 0)
}

export function withinCent(a: number, b: number): boolean {
	return Math.abs(toCents(a) - toCents(b)) <= 1
}

export function money(n: number): string {
	return fromCents(toCents(n)).toFixed(2)
}

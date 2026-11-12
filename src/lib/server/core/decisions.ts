import type PocketBase from 'pocketbase'

export class DecisionConflict extends Error {
	existing: any

	constructor(existing: any) {
		super('Invoice already has a decision')
		this.name = 'DecisionConflict'
		this.existing = existing
	}
}

export async function claimDecision(
	pb: PocketBase,
	invoiceId: string,
	action: 'approve' | 'reject' | 'flag',
	actor: string,
	note = ''
) {
	try {
		return await pb.collection('invoice_decisions').create({
			invoice: invoiceId,
			action,
			actor,
			note: note || null,
			decided_at: new Date().toISOString(),
		})
	} catch (err: any) {
		if (err?.status === 400) {
			const existing = await pb
				.collection('invoice_decisions')
				.getFirstListItem(pb.filter('invoice = {:id}', { id: invoiceId }))
				.catch(() => null)
			if (existing) throw new DecisionConflict(existing)
		}
		throw err
	}
}

export async function releaseDecision(pb: PocketBase, decisionId: string) {
	await pb.collection('invoice_decisions').delete(decisionId).catch(() => {})
}

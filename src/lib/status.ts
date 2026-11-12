const REVIEWABLE_STATUSES = ['needs_review', 'flagged'] as const

export function isReviewable(status: string | null | undefined): boolean {
	return !!status && (REVIEWABLE_STATUSES as readonly string[]).includes(status)
}

export function batchSkipReason(
	action: 'approve' | 'flag',
	status: string | null | undefined
): string | null {
	if (!status) return 'missing status'
	if (!isReviewable(status)) return `status "${status}" is not reviewable`
	return null
}

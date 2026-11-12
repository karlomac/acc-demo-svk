<script lang="ts">
	import Icon from './Icon.svelte'

	let { status, class: className = '' } = $props()

	const variants: Record<string, { bg: string; text: string }> = {
		uploaded: { bg: 'bg-[#EEF1F5]', text: 'text-[#475569]' },
		processing: { bg: 'bg-[#EEF1F5]', text: 'text-[#475569]' },
		needs_review: { bg: 'bg-[#E7EEFF]', text: 'text-[#1D4ED8]' },
		flagged: { bg: 'bg-[#FDECEC]', text: 'text-[#B91C1C]' },
		approved: { bg: 'bg-[#E8F6EC]', text: 'text-[#15803D]' },
		rejected: { bg: 'bg-[#FDECEC]', text: 'text-[#B91C1C]' },
		error: { bg: 'bg-[#FDECEC]', text: 'text-[#B91C1C]' },
	}
	const v = $derived(variants[status] ?? variants.uploaded)
</script>

<span class={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${v.bg} ${v.text} ${className}`}>
	<Icon name={status === 'processing' ? 'clock' : status === 'approved' ? 'check' : status === 'flagged' || status === 'rejected' || status === 'error' ? 'alert-triangle' : 'clock'} size={12} />
	{status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
</span>

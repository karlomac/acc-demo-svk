<script lang="ts">
	let { name, size = 20, class: className = '' } = $props()
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	class={className}
	role="img"
	aria-hidden="true"
	stroke="currentColor"
	fill="none"
	viewBox="0 0 24 24"
	stroke-width="2"
	width={size}
	height={size}>
	{#if name === 'upload'}
		<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
		<polyline points="17 8 12 3 7 8" />
		<line x1="12" y1="3" x2="12" y2="13" />
	{:else if name === 'check'}
		<polyline points="20 6 9 17 4 12" />
	{:else if name === 'alert-triangle'}
		<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0" />
		<line x1="12" y1="9" x2="12" y2="13" />
		<line x1="12" y1="17" x2="12" y2="17" />
	{:else if name === 'x-circle'}
		<circle cx="12" cy="12" r="10" />
		<line x1="15" y1="9" x2="9" y2="15" />
		<line x1="9" y1="9" x2="15" y2="15" />
	{:else if name === 'clock'}
		<circle cx="12" cy="12" r="10" />
		<polyline points="12 6 12 12 16 14" />
	{:else if name === 'file-text'}
		<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
		<polyline points="13 2 13 9 20 9" />
	{:else if name === 'download'}
		<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
		<polyline points="7 10 12 15 17 10" />
		<line x1="12" y1="15" x2="12" y2="3" />
	{:else if name === 'shield-check'}
		<path d="M9 21l5-3 5 3V6c0-3.51-2.29-6.51-5.66-7.67C13.81 3.67 12 2.91 12 2s-1.81.76-2.34 1.67C5.29 4.49 3 7.49 3 12z" />
		<polyline points="9 10 12 13 15 9" />
	{:else if name === 'log-out'}
		<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
		<polyline points="16 17 21 12 16 7" />
		<line x1="21" y1="12" x2="9" y2="12" />
	{:else if name === 'chevron-right'}
		<polyline points="9 18 15 12 9 6" />
	{:else if name === 'edit'}
		<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
		<polyline points="18.5 2.5 12 9 12 12 9 12 9 18.5" />
	{:else if name === 'refresh'}
		<path d="M23 4v6a2 2 0 0 1-2 2H9.9" />
		<path d="M21 14v6a2 2 0 0 1-2 2H3" />
		<polyline points="20.5 4 23 4 23 7" />
		<polyline points="3.5 20 0 20 0 17" />
	{:else if name === 'chevron-down'}
		<polyline points="6 9 12 15 18 9" />
	{/if}
</svg>

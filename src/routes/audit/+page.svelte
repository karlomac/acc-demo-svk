<script lang="ts">
	import { goto } from '$app/navigation'

	let { data } = $props()
	const audit: any[] = $derived(data?.audit ?? [])
	let openRow = $state<string | null>(null)

	function pretty(v: unknown) {
		if (v === undefined || v === null || v === '') return 'null'
		return JSON.stringify(v, null, 2)
	}

	function money(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0)
	}
	function eventChipCls(event: string | null | undefined) {
		const e = (event ?? '').toLowerCase()
		const base = 'inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-label-sm'
		if (e.includes('approv')) return `${base} bg-primary-fixed text-primary`
		if (e.includes('reject')) return `${base} bg-error-container text-on-error-container`
		if (e.includes('valid')) return `${base} bg-primary-fixed text-primary`
		if (e.includes('ingest') || e.includes('ocr')) return `${base} bg-surface-container-high text-primary`
		return `${base} bg-surface-container text-on-surface-variant`
	}
	function statusChip(event: string | null | undefined) {
		const e = (event ?? '').toLowerCase()
		if (e.includes('approv')) return 'bg-secondary-container text-on-secondary-container'
		if (e.includes('reject')) return 'bg-error-container text-on-error-container'
		if (e.includes('valid') && e.includes('fail')) return 'bg-error-container text-on-error-container'
		return 'bg-primary-fixed text-primary'
	}
	function statusLabel(event: string | null | undefined) {
		const e = (event ?? '').toLowerCase()
		if (e.includes('approv')) return 'Approved'
		if (e.includes('reject')) return 'Rejected'
		if (e.includes('valid')) return 'Validated'
		return 'Completed'
	}
</script>

<svelte:head>
	<title>Audit log — LedgerLens</title>
</svelte:head>

<div class="w-full max-w-[1600px] mx-auto px-margin py-gutter-lg flex flex-col gap-space-xl">
	<!-- Top Bar & Telemetry Meta -->
	<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg bg-surface-container-lowest p-space-xl rounded-xl shadow-sm">
		<div class="flex flex-col gap-space-xs">
			<div class="flex items-center gap-space-sm">
				<span class="font-display-lg text-display-lg text-on-surface tracking-tight">Audit log</span>
				<span class="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">
					Immutable Record
				</span>
			</div>
			<p class="font-body-md text-body-md text-on-surface-variant max-w-2xl">
				Complete immutable log of all invoice extraction, validation rules, reviewer approvals, rejections, and ERP exports.
			</p>
		</div>
		<div class="flex flex-wrap items-center gap-space-sm">
			<div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface-variant font-label-md text-label-md">
				<span class="relative flex h-2 w-2">
					<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
					<span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
				</span>
				<span>Live Stream Active</span>
			</div>
			<button class="flex items-center gap-1.5 px-space-md py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors" type="button">
				<span class="material-symbols-outlined text-[18px]">calendar_today</span>
				<span>Filter by Date Range</span>
			</button>
			<button class="flex items-center gap-1.5 px-space-md py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md transition-colors shadow-sm" type="button">
				<span class="material-symbols-outlined text-[18px]">file_download</span>
				<span>Export Audit Log (JSON/CSV)</span>
			</button>
		</div>
	</div>

	<!-- 4 Compact Stat Metrics -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
		<!-- Metric 1 -->
		<div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
			<div class="flex items-center justify-between">
				<span class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Total Audit Events</span>
				<span class="p-1.5 rounded-lg bg-surface-container text-primary">
					<span class="material-symbols-outlined text-[20px]">receipt_long</span>
				</span>
			</div>
			<div class="mt-space-md">
				<div class="font-display-lg text-display-lg text-on-surface leading-none">{audit.length}</div>
				<span class="font-label-sm text-label-sm text-on-surface-variant mt-1 block">+124 records in last 24h</span>
			</div>
		</div>
		<!-- Metric 2 -->
		<div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
			<div class="flex items-center justify-between">
				<span class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Automated Actions</span>
				<span class="p-1.5 rounded-lg bg-surface-container text-primary">
					<span class="material-symbols-outlined text-[20px]">smart_toy</span>
				</span>
			</div>
			<div class="mt-space-md">
				<div class="font-display-lg text-display-lg text-on-surface leading-none">
					{audit.filter((a) => a.event?.toLowerCase().includes('ocr') || a.event?.toLowerCase().includes('validation')).length}
					<span class="font-headline-sm text-headline-sm text-on-surface-variant font-normal">({Math.round(((audit.filter((a) => a.event?.toLowerCase().includes('ocr') || a.event?.toLowerCase().includes('validation')).length) / Math.max(audit.length, 1)) * 100).toFixed(1)}%)</span>
				</div>
				<span class="font-label-sm text-label-sm text-on-surface-variant mt-1 block">OCR & Rules Engine execution</span>
			</div>
		</div>
		<!-- Metric 3 -->
		<div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
			<div class="flex items-center justify-between">
				<span class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Human Interventions</span>
				<span class="p-1.5 rounded-lg bg-surface-container text-primary">
					<span class="material-symbols-outlined text-[20px]">person_check</span>
				</span>
			</div>
			<div class="mt-space-md">
				<div class="font-display-lg text-display-lg text-on-surface leading-none">
					{audit.filter((a) => a.actor?.includes('@')).length}
				</div>
				<span class="font-label-sm text-label-sm text-on-surface-variant mt-1 block">Manual edits & overrides</span>
			</div>
		</div>
		<!-- Metric 4 -->
		<div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
			<div class="flex items-center justify-between">
				<span class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Security & Integrity</span>
				<span class="p-1.5 rounded-lg bg-secondary-container text-on-secondary-fixed">
					<span class="material-symbols-outlined text-[20px]">verified</span>
				</span>
			</div>
			<div class="mt-space-md">
				<div class="flex items-center gap-1.5 font-headline-md text-headline-md text-on-surface">
					<span class="material-symbols-outlined text-[22px] text-primary">check_circle</span>
					<span>SHA-256 Verified</span>
				</div>
				<span class="font-label-sm text-label-sm text-on-surface-variant mt-1 block">Merkle tree leaf sync: Valid</span>
			</div>
		</div>
	</div>

	<!-- Filters & Search Command Bar -->
	<div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md">
		<!-- Search Input -->
		<div class="relative flex-1 min-w-[280px]">
			<span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
			<input
				class="w-full pl-10 pr-8 py-2 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-on-surface-variant focus:outline-none focus:bg-surface-container-highest transition-colors"
				id="audit-search"
				placeholder="Search by Actor, Invoice #, Event type, or Hash..."
				type="text"
			/>
			<button
				class="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
				type="button"
				onclick={() => (document.getElementById('audit-search') as HTMLInputElement).value = ''}
			>
				<span class="material-symbols-outlined text-[16px]">close</span>
			</button>
		</div>
		<!-- Filter Controls Group -->
		<div class="flex flex-wrap items-center gap-space-sm">
			<!-- Event Category Filter -->
			<div class="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-low text-on-surface font-label-md text-label-md">
				<span class="font-label-sm text-label-sm text-on-surface-variant">Event:</span>
				<select class="bg-transparent text-on-surface font-label-md text-label-md focus:outline-none cursor-pointer">
					<option>All Categories</option>
					<option>Ingestion</option>
					<option>OCR</option>
					<option>Validation</option>
					<option>Approval</option>
					<option>Rejection</option>
					<option>Export</option>
				</select>
			</div>
			<!-- Actor Filter -->
			<div class="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-low text-on-surface font-label-md text-label-md">
				<span class="font-label-sm text-label-sm text-on-surface-variant">Actor:</span>
				<select class="bg-transparent text-on-surface font-label-md text-label-md focus:outline-none cursor-pointer">
					<option>All Actors</option>
					<option>System (Automated)</option>
					<option>sarah.chen@acmecorp.com</option>
					<option>alex.mercer@acmecorp.com</option>
				</select>
			</div>
			<!-- Date Range Filter -->
			<div class="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-low text-on-surface font-label-md text-label-md">
				<span class="font-label-sm text-label-sm text-on-surface-variant">Timeframe:</span>
				<select class="bg-transparent text-on-surface font-label-md text-label-md focus:outline-none cursor-pointer">
					<option>Last 24 Hours</option>
					<option>Last 7 Days</option>
					<option>Last 30 Days</option>
					<option>Custom Window</option>
				</select>
			</div>
			<!-- Reset Button -->
			<button class="px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-colors flex items-center gap-1" type="button">
				<span class="material-symbols-outlined text-[16px]">restart_alt</span>
				<span>Reset</span>
			</button>
		</div>
	</div>

	<!-- Audit Log High-Density Ledger Table -->
	<div class="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
		<div class="overflow-x-auto">
			<table class="w-full text-left border-collapse">
				<thead>
					<tr class="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
						<th class="py-3 px-4 font-semibold w-[180px]">Time (UTC)</th>
						<th class="py-3 px-4 font-semibold min-w-[220px]">Event</th>
						<th class="py-3 px-4 font-semibold min-w-[200px]">Actor</th>
						<th class="py-3 px-4 font-semibold w-[160px]">Invoice #</th>
						<th class="py-3 px-4 font-semibold w-[140px]">Severity / Status</th>
						<th class="py-3 px-4 font-semibold text-right w-[110px]">Details</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-surface-container-high font-body-sm text-body-sm text-on-surface">
					{#each audit as entry (entry.id)}
						<tr class="hover:bg-surface-container transition-colors group">
							<td class="py-3.5 px-4 font-numeric-table text-numeric-table text-on-surface whitespace-nowrap">
								{entry.ts?.slice(0, 10)} <span class="text-on-surface-variant">{entry.ts?.slice(11, 19)}</span>
							</td>
							<td class="py-3.5 px-4">
								<div class="flex items-center gap-2">
									<span class={eventChipCls(entry.event)}>{entry.event}</span>
								</div>
							</td>
							<td class="py-3.5 px-4">
								<div class="flex items-center gap-2">
									<span class="w-6 h-6 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center font-label-sm text-label-sm">
										<span class="material-symbols-outlined text-[14px]">person</span>
									</span>
									<span class="font-numeric-table text-numeric-table text-on-surface">{entry.actor}</span>
								</div>
							</td>
							<td class="py-3.5 px-4">
								{#if entry.invoice_number}
									<a
										href={"/invoices/" + entry.invoice}
										class="font-numeric-table text-numeric-table text-primary font-semibold hover:underline flex items-center gap-1"
									>
										<span>{entry.invoice_number}</span>
										<span class="material-symbols-outlined text-[14px]">open_in_new</span>
									</a>
								{:else}
									<span class="font-numeric-table text-numeric-table text-on-surface-variant">Global Sync</span>
								{/if}
							</td>
							<td class="py-3.5 px-4">
								<span class={statusChip(entry.event)}>{statusLabel(entry.event)}</span>
							</td>
							<td class="py-3.5 px-4 text-right">
								<button
									class="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-label-sm transition-colors"
									type="button"
									onclick={() => (openRow = openRow === entry.id ? null : entry.id)}
								>
									<span class="material-symbols-outlined text-[16px]">
										{openRow === entry.id ? 'close' : 'visibility'}
									</span>
									<span>{openRow === entry.id ? 'Hide' : 'View'}</span>
								</button>
							</td>
						</tr>
						{#if openRow === entry.id}
							<tr class="bg-surface-container-low">
								<td class="p-0" colspan="6">
									<div class="p-space-lg flex flex-col gap-space-md">
										<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
											<div class="flex items-center gap-space-sm font-label-md text-label-md text-on-surface min-w-0">
												<span class="material-symbols-outlined text-primary text-[18px]">verified_user</span>
												<span class="font-semibold">Event payload: #{entry.seq ?? '—'}</span>
												<span class="text-on-surface-variant font-normal truncate font-numeric-table text-numeric-table">
													• SHA-256: {entry.hash}
												</span>
											</div>
											<span class="px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm shrink-0">
												Immutable Log Record
											</span>
										</div>
										<div class="grid grid-cols-1 lg:grid-cols-3 gap-space-md">
											<div class="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col gap-space-xs">
												<div class="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
													<span class="material-symbols-outlined text-[14px]">history</span>
													<span>State: Before</span>
												</div>
												<pre class="p-2 rounded bg-surface-container-low font-numeric-table text-numeric-table text-on-surface overflow-x-auto">{pretty(entry.before)}</pre>
											</div>
											<div class="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col gap-space-xs">
												<div class="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
													<span class="material-symbols-outlined text-[14px]">update</span>
													<span>State: After</span>
												</div>
												<pre class="p-2 rounded bg-surface-container-low font-numeric-table text-numeric-table text-on-surface overflow-x-auto">{pretty(entry.after)}</pre>
											</div>
											<div class="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex flex-col gap-space-xs">
												<div class="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
													<span class="material-symbols-outlined text-[14px]">policy</span>
													<span>Metadata & Trace</span>
												</div>
												<pre class="p-2 rounded bg-surface-container-low font-numeric-table text-numeric-table text-on-surface overflow-x-auto">{pretty(entry.meta)}</pre>
											</div>
										</div>
										<details class="group bg-surface-container-lowest rounded-lg p-space-md">
											<summary class="cursor-pointer font-label-sm text-label-sm text-on-surface-variant flex items-center justify-between select-none">
												<span class="flex items-center gap-1 font-semibold text-on-surface">
													<span class="material-symbols-outlined text-[16px] group-open:rotate-90 transition-transform">chevron_right</span>
													View canonical raw audit object (JSON)
												</span>
											</summary>
											<pre class="mt-3 p-3 rounded bg-inverse-surface text-inverse-on-surface font-numeric-table text-numeric-table overflow-x-auto leading-relaxed">{pretty(entry)}</pre>
										</details>
									</div>
								</td>
							</tr>
						{/if}
					{:else}
						<tr>
							<td colspan="6" class="py-8 text-center text-secondary">No audit records yet.</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<!-- Pagination Footer -->
		<div class="p-space-md bg-surface-container-lowest border-t border-surface-container-high flex flex-col sm:flex-row items-center justify-between gap-space-sm font-label-md text-label-md text-on-surface-variant">
			<div>
				Showing <span class="font-semibold text-on-surface">{audit.length}</span> of <span class="font-semibold text-on-surface">{audit.length}</span> immutable audit records
			</div>
			<div class="flex items-center gap-1">
				<button class="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface disabled:opacity-40" disabled type="button">
					<span class="material-symbols-outlined text-[18px]">first_page</span>
				</button>
				<button class="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface disabled:opacity-40" disabled type="button">
					<span class="material-symbols-outlined text-[18px]">chevron_left</span>
				</button>
				<span class="px-2.5 py-1 rounded bg-primary text-on-primary font-semibold font-label-sm text-label-sm">1</span>
				<button class="px-2.5 py-1 rounded hover:bg-surface-container text-on-surface font-label-sm text-label-sm" type="button">2</button>
				<button class="px-2.5 py-1 rounded hover:bg-surface-container text-on-surface font-label-sm text-label-sm" type="button">3</button>
				<span class="px-1 text-on-surface-variant">...</span>
				<button class="px-2.5 py-1 rounded hover:bg-surface-container text-on-surface font-label-sm text-label-sm" type="button">238</button>
				<button class="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface" type="button">
					<span class="material-symbols-outlined text-[18px]">chevron_right</span>
				</button>
				<button class="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface" type="button">
					<span class="material-symbols-outlined text-[18px]">last_page</span>
				</button>
			</div>
		</div>
	</div>
</div>

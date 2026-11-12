<script lang="ts">
	import { enhance } from '$app/forms'
	import { invalidateAll } from '$app/navigation'
	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'
	import { isReviewable } from '../../../lib/status'

	let { data, form } = $props()
	const invoice: any = $derived(data?.invoice)
	const lines: any[] = $derived(data?.lines ?? [])
	const audit: any[] = $derived(data?.audit ?? [])

	const validation: any[] = $derived(Array.isArray(invoice?.validation_json) ? invoice.validation_json : [])
	const blockingFailures = $derived(
		validation.filter((c: any) => c.status === 'fail' && c.severity === 'blocking')
	)
	const taxPct = $derived(
		invoice?.subtotal ? ((invoice.tax / invoice.subtotal) * 100).toFixed(2) : null
	)
	const po: any = $derived(data?.po ?? null)
	const overage = $derived(po ? invoice.total > po.total_amount : false)

	let showPdfModal = $state(false)
	let line3Confirmed = $state(false)

	function money(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0)
	}
	function dateLabel(s: string | null) {
		return s ?? '—'
	}
	function statusChipCls(status: string | null | undefined) {
		const s = status ?? 'uploaded'
		const base = 'inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-label-sm'
		if (s === 'needs_review') return `${base} bg-primary-fixed text-primary`
		if (s === 'flagged') return `${base} bg-error-container text-on-error-container`
		if (s === 'approved') return `${base} bg-secondary-container text-on-secondary-container`
		return `${base} bg-surface-container-high text-primary`
	}
	function statusLabel(status: string | null | undefined) {
		return (status ?? 'uploaded').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
	}
	function checkCls(c: any) {
		const base = 'text-xs font-medium px-2 py-1 rounded border'
		if (c.status === 'pass') return `${base} bg-surface-container-high text-primary font-semibold`
		if (c.status === 'skip') return `${base} bg-surface-container text-on-surface-variant`
		return c.severity === 'blocking' ? `${base} bg-error-container text-on-error-container font-semibold` : `${base} bg-tertiary-fixed text-tertiary font-semibold`
	}

	function toggleLine3Confirmed() {
		line3Confirmed = !line3Confirmed
	}

	async function updateLine(lineId: string, accountCode: string | null, confirmed: boolean, needsReview: boolean) {
		const fd = new FormData()
		fd.append('line_id', lineId)
		fd.append('account_code', accountCode ?? '')
		fd.append('confirmed', String(confirmed))
		fd.append('needs_review', String(needsReview))
		await fetch(`?/update_line`, { method: 'POST', body: fd })
		await invalidateAll()
	}
</script>

<svelte:head>
	<title>Invoice {invoice?.invoice_number} — LedgerLens</title>
</svelte:head>

<div class="w-full max-w-[1600px] mx-auto px-margin py-gutter space-y-gutter">
	<!-- Top Navigation & Header Row -->
	<div class="flex flex-col gap-space-sm">
		<div class="flex items-center justify-between">
			<a
				href={resolve('/queue')}
				class="inline-flex items-center gap-1.5 text-primary hover:text-on-primary-fixed-variant font-label-md text-label-md transition-colors group"
			>
				<span class="material-symbols-outlined text-[18px] transition-transform group-hover:-translate-x-0.5">arrow_back</span>
				<span>Back to queue</span>
			</a>
			<div class="flex items-center gap-space-sm text-secondary font-label-sm text-label-sm">
				<span class="flex items-center gap-1">
					<span class="material-symbols-outlined text-[15px]">schedule</span>
					<span>Issued: {dateLabel(invoice.invoice_date)}</span>
				</span>
				<span class="text-outline-variant">•</span>
				<span>Terms: {dateLabel(invoice.payment_terms)}</span>
			</div>
		</div>
		<div class="flex flex-wrap items-center justify-between gap-space-md pt-space-xs">
			<div class="flex flex-wrap items-center gap-space-md">
				<div class="flex items-baseline gap-space-sm">
					<h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">{invoice.invoice_number}</h1>
					<span class="text-on-surface-variant font-headline-sm text-headline-sm">/</span>
					<span class="font-headline-sm text-headline-sm text-on-surface-variant">{invoice.vendor_name}</span>
				</div>
				<!-- Flagged Status Badge -->
				<span class={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-semibold shadow-sm ${invoice.status === 'flagged' ? 'bg-error-container text-on-error-container' : 'bg-primary-fixed text-primary'}`}>
					<span class="material-symbols-outlined text-[14px]">flag</span>
					{statusLabel(invoice.status)}
				</span>
			</div>
			<div class="flex items-center gap-space-sm">
				<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container font-label-sm text-label-sm text-on-surface-variant">
					<span class="material-symbols-outlined text-[16px] text-secondary">tag</span>
					{dateLabel(invoice.po_number)}
				</span>
				<div class="inline-flex items-center rounded-lg bg-surface-container-lowest shadow-sm">
					<span class="inline-flex items-center gap-1 px-2.5 py-1 text-on-surface font-label-sm text-label-sm">
						<span class="material-symbols-outlined text-[16px] text-primary">description</span>
						{invoice.original_filename}
						
					</span>
					<button class="p-1 px-2 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-r-lg transition-colors" type="button" title="Download Original">
						<span class="material-symbols-outlined text-[18px]">download</span>
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Critical Alert Banner -->
	{#if invoice.status === 'flagged'}
		<div class="w-full rounded-xl bg-error-container p-space-md shadow-sm">
			<div class="flex items-start gap-space-md">
				<div class="p-1 rounded-lg bg-error text-on-error flex items-center justify-center shrink-0">
					<span class="material-symbols-outlined text-[20px]">error</span>
				</div>
				<div class="flex-1 min-w-0">
					<div class="flex items-center justify-between gap-space-sm">
						<span class="font-headline-sm text-headline-sm text-on-error-container">Validation Alert: {blockingFailures.length} blocking validation error(s) detected</span>
						<span class="px-2 py-0.5 rounded bg-surface-container-lowest/80 text-on-error-container font-label-sm text-label-sm uppercase tracking-wider">Halt Code: {blockingFailures[0]?.id ?? '—'}</span>
					</div>
					<p class="font-body-md text-body-md text-on-error-container/90 mt-space-xs">
						Auto-approval halted. {blockingFailures.map((c: any) => c.title).join('; ') || 'One or more blocking checks failed.'} Review diagnostics below before committing changes.
					</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Summary Financial Metric Cards -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
		<div class="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
			<div>
				<div class="flex items-center justify-between text-secondary">
					<span class="font-label-sm text-label-sm uppercase tracking-wider">Subtotal</span>
					<span class="material-symbols-outlined text-[18px]">receipt_long</span>
				</div>
				<div class="font-display-lg text-display-lg text-on-surface mt-space-xs tabular-nums">{money(invoice.subtotal)}</div>
			</div>
			<div class="mt-space-md flex items-center gap-1.5 text-on-surface-variant font-label-md text-label-md">
				<span class="material-symbols-outlined text-[16px] text-primary">done_all</span>
				<span>Extracted from {lines.length} item lines</span>
			</div>
		</div>
		<div class="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
			<div>
				<div class="flex items-center justify-between text-secondary">
					<span class="font-label-sm text-label-sm uppercase tracking-wider">Tax{taxPct ? ` (${taxPct}%)` : ''}</span>
					<span class="material-symbols-outlined text-[18px]">percent</span>
				</div>
				<div class="font-display-lg text-display-lg text-on-surface mt-space-xs tabular-nums">{money(invoice.tax)}</div>
			</div>
			<div class="mt-space-md flex items-center gap-1.5 text-on-surface-variant font-label-md text-label-md">
				<span class="material-symbols-outlined text-[16px] text-primary">verified</span>
				<span>Matched calculated tax rule</span>
			</div>
		</div>
		<div class="p-space-lg rounded-xl bg-primary text-on-primary shadow-md flex flex-col justify-between relative overflow-hidden">
			<div class="absolute -right-4 -bottom-4 w-28 h-28 rounded-full bg-surface-container-lowest/10 pointer-events-none"></div>
			<div>
				<div class="flex items-center justify-between text-primary-fixed">
					<span class="font-label-sm text-label-sm uppercase tracking-wider font-semibold">Total Payable</span>
					<span class="px-2 py-0.5 rounded-full bg-surface-container-lowest/20 font-label-sm text-label-sm">USD ($)</span>
				</div>
				<div class="font-display-lg text-display-lg text-on-primary mt-space-xs tabular-nums font-bold">{money(invoice.total)}</div>
			</div>
			<div class="mt-space-md flex items-center justify-between text-primary-fixed font-label-md text-label-md">
				<span>Settlement Currency: USD</span>
				{#if invoice.due_date}<span class="font-semibold text-surface-container-lowest bg-surface-container-lowest/20 px-2 py-0.5 rounded">Due {dateLabel(invoice.due_date)}</span>{/if}
			</div>
		</div>
	</div>

	<!-- Main Two-Column Layout: Details + Document Pane -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg">
		<!-- Left Column: Master Key-Value Records & PO Discrepancy (8 cols) -->
		<div class="lg:col-span-8 flex flex-col gap-space-lg">
			<div class="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm">
				<div class="flex items-center justify-between pb-space-md">
					<div class="flex items-center gap-2">
						<span class="material-symbols-outlined text-primary text-[20px]">badge</span>
						<h2 class="font-headline-sm text-headline-sm text-on-surface">Invoice Metadata & Extraction Spec</h2>
					</div>
					<span class="font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
						Parsed {dateLabel(invoice.invoice_date)}
					</span>
				</div>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-space-md pt-space-sm">
					<div class="p-space-sm rounded-lg bg-surface-container-low flex flex-col">
						<span class="font-label-sm text-label-sm text-secondary uppercase">Vendor</span>
						<span class="font-body-lg text-body-lg text-on-surface font-semibold mt-0.5">{invoice.vendor_name}</span>
						<span class="font-label-md text-label-md text-on-surface-variant">Currency: {invoice.currency ?? '—'}</span>
					</div>
					<div class="p-space-sm rounded-lg bg-surface-container-low flex flex-col">
						<span class="font-label-sm text-label-sm text-secondary uppercase">Invoice Identification</span>
						<span class="font-body-lg text-body-lg text-on-surface font-semibold mt-0.5">{invoice.invoice_number}</span>
						<span class="font-label-md text-label-md text-secondary">Ref: #{invoice.id?.slice(0, 8).toUpperCase()}</span>
					</div>
					<div class="p-space-sm rounded-lg bg-surface-container-low flex flex-col">
						<span class="font-label-sm text-label-sm text-secondary uppercase">Issue & Maturity Schedule</span>
						<div class="flex items-center gap-space-sm mt-0.5">
							<span class="font-body-md text-body-md text-on-surface font-semibold">{dateLabel(invoice.invoice_date)}</span>
							<span class="text-secondary text-[12px]">→</span>
							<span class="font-body-md text-body-md text-error font-semibold">{dateLabel(invoice.due_date)}</span>
						</div>
						<span class="font-label-md text-label-md text-secondary">Terms: {dateLabel(invoice.payment_terms)}</span>
					</div>
					<div class={`p-space-sm rounded-lg flex flex-col ${overage ? 'bg-error-container/40' : 'bg-surface-container-low'}`}>
						<div class="flex items-center justify-between">
							<span class={`font-label-sm text-label-sm uppercase font-semibold ${overage ? 'text-error' : 'text-secondary'}`}>Purchase Order Match</span>
							<span class={`material-symbols-outlined text-[16px] ${overage ? 'text-error' : 'text-primary'}`}>{overage ? 'warning' : 'verified'}</span>
						</div>
						<span class="font-body-lg text-body-lg text-on-surface font-semibold mt-0.5">{dateLabel(invoice.po_number)}</span>
						{#if po}
							<span class={`font-label-md text-label-md font-semibold ${overage ? 'text-error' : 'text-on-surface-variant'}`}>
								Ceiling: {money(po.total_amount)}
								{#if overage}(Overage: +{money(invoice.total - po.total_amount)}){:else}· Within authorized ceiling{/if}
							</span>
						{:else}
							<span class="font-label-md text-label-md text-on-surface-variant flex items-center gap-1">
								<span class="material-symbols-outlined text-[14px]">check</span> No PO match required
							</span>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Right Column: Interactive PDF Preview Card (4 cols) -->
		<div class="lg:col-span-4 flex flex-col">
			<div class="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col h-full justify-between">
				<div>
					<div class="flex items-center justify-between pb-space-sm">
						<span class="font-headline-sm text-headline-sm text-on-surface">Source Document</span>
						<span class="font-label-sm text-label-sm text-secondary">Page 1 of 1</span>
					</div>
					<!-- Simulated OCR Document Preview Area -->
					<div
						class="relative w-full h-48 rounded-lg bg-surface-container-low overflow-hidden group cursor-pointer"
						onclick={() => (showPdfModal = true)}
					>
						<div class="p-space-md space-y-2 select-none opacity-85">
							<div class="flex justify-between items-center pb-1">
								<div class="h-3 w-16 bg-primary/40 rounded"></div>
								<div class="h-3 w-12 bg-secondary-fixed-dim rounded"></div>
							</div>
							<div class="h-2 w-36 bg-surface-container-highest rounded"></div>
							<div class="h-2 w-28 bg-surface-container-highest rounded"></div>
							<div class="mt-4 pt-2 space-y-1.5">
								<div class="h-2.5 w-full bg-surface-container-high rounded"></div>
								<div class="h-2.5 w-5/6 bg-surface-container-high rounded"></div>
								<div class="h-2.5 w-4/6 bg-surface-container-high rounded"></div>
							</div>
							<div class="pt-3 flex justify-end">
								<div class="h-4 w-20 bg-error/30 rounded"></div>
							</div>
						</div>
						<!-- Highlighting Overlay of OCR Bounding Boxes -->
						<div class="absolute inset-0 bg-primary-container/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
							<span class="px-3 py-1.5 rounded-lg bg-on-surface text-surface-container-lowest font-label-md text-label-md shadow-lg flex items-center gap-1.5">
								<span class="material-symbols-outlined text-[16px]">visibility</span>
								Inspect OCR Layers
							</span>
						</div>
					</div>
					<div class="pt-space-md flex gap-space-sm">
						<button
							class="flex-1 py-2 px-3 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high font-label-md text-label-md font-semibold transition-colors flex items-center justify-center gap-1.5"
							type="button"
							onclick={() => (showPdfModal = true)}
						>
							<span class="material-symbols-outlined text-[16px]">zoom_in</span>
							View Original PDF
						</button>
						<button
							class="py-2 px-3 rounded-lg bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
							type="button"
							title="Re-scan OCR Coordinates"
						>
							<span class="material-symbols-outlined text-[18px]">sync</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Validation Checks Table -->
	<div class="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden">
		<div class="p-space-lg flex flex-wrap items-center justify-between gap-space-md">
			<div>
				<h2 class="font-headline-sm text-headline-sm text-on-surface">Automated Validation Telemetry</h2>
				<p class="font-body-sm text-body-sm text-secondary mt-0.5">Continuous verification suite V001 through V009 executed against company rules</p>
			</div>
			<div class="flex items-center gap-2">
				<span class="px-2.5 py-1 rounded-full bg-surface-container text-secondary font-label-sm text-label-sm">
					{validation.filter((c) => c.status === 'pass').length} Passed
				</span>
				<span class="px-2.5 py-1 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">
					{validation.filter((c) => c.status === 'fail').length} Failed
				</span>
			</div>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-left">
				<thead class="bg-surface-container-low text-secondary font-label-sm text-label-sm uppercase tracking-wider">
					<tr>
						<th class="py-space-sm px-space-lg">Check Code</th>
						<th class="py-space-sm px-space-lg">Validation Rule</th>
						<th class="py-space-sm px-space-lg">Result</th>
						<th class="py-space-sm px-space-lg">Message / Diagnostic</th>
					</tr>
				</thead>
				<tbody class="divide-y-0 text-body-sm text-body-sm">
					{#each validation as check}
						<tr class={check.status === 'fail' ? 'bg-error-container/20 hover:bg-error-container/30 transition-colors' : 'hover:bg-surface-container-low/60 transition-colors'}>
							<td class="py-space-sm px-space-lg font-numeric-table text-numeric-table font-semibold {check.status === 'fail' ? 'text-error' : 'text-secondary'}">
								{check.id}
							</td>
							<td class="py-space-sm px-space-lg font-body-md text-body-md text-on-surface font-medium">{check.title}</td>
							<td class="py-space-sm px-space-lg">
								<span class={checkCls(check)}>
									{#if check.status === 'pass'}
										<span class="material-symbols-outlined text-[13px]">check_circle</span> PASS
									{:else if check.status === 'fail'}
										<span class="material-symbols-outlined text-[13px]">cancel</span> FAIL
									{:else}
										SKIP
									{/if}
								</span>
							</td>
							<td class="py-space-sm px-space-lg text-secondary {check.status === 'fail' ? 'text-error font-medium' : ''}">
								{check.message}
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="4" class="py-space-sm px-space-lg text-secondary">No validation results yet. Process the invoice first.</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Line Items Table with High-Density GL Coding -->
	<div class="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden">
		<div class="p-space-lg flex flex-wrap items-center justify-between gap-space-md">
			<div>
				<h2 class="font-headline-sm text-headline-sm text-on-surface">Invoice Line Item Breakdown & GL Mapping</h2>
				<p class="font-body-sm text-body-sm text-secondary mt-0.5">{lines.length} extracted items with autonomous GL assignment scoring</p>
			</div>
			<button
				class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high font-label-md text-label-md font-medium transition-colors"
				type="button"
			>
				<span class="material-symbols-outlined text-[16px]">add</span>
				Add Item Adjustment
			</button>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-left">
				<thead class="bg-surface-container-low text-secondary font-label-sm text-label-sm uppercase tracking-wider">
					<tr>
						<th class="py-space-sm px-space-lg">Description</th>
						<th class="py-space-sm px-space-md text-center">Qty</th>
						<th class="py-space-sm px-space-md text-right">Unit Price</th>
						<th class="py-space-sm px-space-md text-right">Amount</th>
						<th class="py-space-sm px-space-lg">GL Account (AI Suggestion)</th>
						<th class="py-space-sm px-space-md text-center">Review Tag</th>
						<th class="py-space-sm px-space-lg text-center">Confirmed</th>
					</tr>
				</thead>
				<tbody class="divide-y-0 text-body-sm text-body-sm">
					{#each lines as line}
						<tr class={line.needs_review ? 'bg-primary-fixed/20 hover:bg-primary-fixed/30 transition-colors' : 'hover:bg-surface-container-low/40 transition-colors'}>
							<td class="py-space-md px-space-lg font-body-md text-body-md text-on-surface font-medium max-w-xs">
								{line.description}
							</td>
							<td class="py-space-md px-space-md text-center tabular-nums text-secondary">{line.quantity}</td>
							<td class="py-space-md px-space-md text-right tabular-nums text-on-surface font-numeric-table text-numeric-table">
								{money(line.unit_price)}
							</td>
							<td class="py-space-md px-space-md text-right tabular-nums text-on-surface font-numeric-table text-numeric-table font-semibold">
								{money(line.amount)}
							</td>
							<td class="py-space-md px-space-lg">
								<div class="flex flex-col gap-1">
									<div class="flex items-center gap-2">
										<select
											class="text-label-md font-label-md text-on-surface bg-surface-container-lowest px-2.5 py-1.5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
											onchange={(e) => updateLine(line.id, (e.target as HTMLSelectElement).value, line.confirmed, line.needs_review)}
										>
											<option selected value={line.final_account_code ?? line.suggested_account_code ?? ''}>
												{line.final_account_code ?? line.suggested_account_code ?? '—'} {line.confidence ? `(${Math.round(line.confidence * 100)}% match)` : ''}
											</option>
											<option value="6100-20">6100-20 - Payment Processing Fees</option>
											<option value="6300-15">6300-15 - Software Licenses & Subscriptions</option>
											<option value="6050-10">6050-10 - IT Consulting Services</option>
										</select>
									</div>
									{#if line.needs_review}
										<span class="text-error font-label-sm text-label-sm font-semibold flex items-center gap-1">
											<span class="material-symbols-outlined text-[13px]">warning</span>
											Low AI confidence score. Manual selection advised.
										</span>
									{/if}
								</div>
							</td>
							<td class="py-space-md px-space-md text-center">
								<span class={`inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-label-sm font-semibold ${line.needs_review ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-primary'}`}>
									{line.needs_review ? 'needs-review' : 'confirmed'}
								</span>
							</td>
							<td class="py-space-md px-space-lg text-center">
								<button
									class={`inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors ${line.confirmed ? 'bg-surface-container-high text-primary' : line.needs_review ? 'bg-error-container text-on-error-container hover:bg-primary hover:text-on-primary' : 'bg-surface-container-high text-primary'}`}
									title={line.confirmed ? 'Verified' : line.needs_review ? 'Click to verify code' : 'Pending confirmation'}
									type="button"
									onclick={(e) => {
										e.stopPropagation()
										updateLine(line.id, line.final_account_code ?? line.suggested_account_code ?? null, !line.confirmed, line.needs_review)
									}}
								>
									{#if line.confirmed}
										<span class="material-symbols-outlined text-[18px]">check</span>
									{:else if line.needs_review}
										<span class="material-symbols-outlined text-[18px]">priority_high</span>
									{:else}
										<span class="material-symbols-outlined text-[18px]">check</span>
									{/if}
								</button>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="7" class="py-space-md px-space-lg text-secondary text-center">No line items extracted yet.</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Reviewer Decision Card & Actions -->
	<form method="POST" action="?/approve" use:enhance>
		<div class="rounded-xl bg-surface-container-lowest shadow-md p-space-xl">
			<div class="max-w-4xl mx-auto space-y-space-lg">
				<div class="flex flex-wrap items-center justify-between gap-space-sm">
					<div>
						<h2 class="font-headline-md text-headline-md text-on-surface">Reviewer Decision & Exceptions</h2>
						<p class="font-body-md text-body-md text-secondary mt-0.5">
							Authorization and sign-off on purchase overages and general ledger account assignment
						</p>
					</div>
					<div class="flex items-center gap-2">
						<span class="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-2 py-1 rounded">
							Auditor: {data?.user?.email ?? 'system'}
						</span>
					</div>
				</div>
				<div class="space-y-space-sm">
					<label class="block font-label-md text-label-md text-on-surface uppercase tracking-wider" for="reviewer-notes">
						Reviewer Note & Audit Justification
					</label>
					<textarea
						name="note"
						id="reviewer-notes"
						rows="3"
						class="w-full p-space-md rounded-lg bg-surface-container-low text-on-surface placeholder:text-secondary font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-y"
						placeholder="Document reason for PO overage override or rejection justification..."
					></textarea>
				</div>
				<div class="flex items-start gap-space-sm p-space-md rounded-lg bg-surface-container-low">
					<input
						id="gaap-confirm"
						name="gaap"
						value="true"
						type="checkbox"
						class="mt-1 w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer accent-primary"
					/>
					<label class="font-body-md text-body-md text-on-surface cursor-pointer select-none" for="gaap-confirm">
						I confirm all GL coding classifications are compliant with GAAP standards and the associated purchase order delta has been reviewed with controller guidelines.
					</label>
				</div>
				{#if form?.error}
					<div class="rounded-lg bg-error-container text-on-error-container px-space-md py-space-sm font-body-sm text-body-sm">
						{form.error}
					</div>
				{/if}
				{#if !isReviewable(invoice.status)}
					<div class="rounded-lg bg-surface-container text-on-surface-variant px-space-md py-space-sm font-body-sm text-body-sm">
						This invoice is <strong>{statusLabel(invoice.status)}</strong> and can no longer be approved or rejected.
					</div>
				{/if}
				<div class="flex flex-wrap items-center justify-between gap-space-md pt-space-xs">
					<div class="flex items-center gap-space-sm">
						<button
							type="submit"
							disabled={!isReviewable(invoice.status)}
							class="px-5 py-2.5 rounded-lg bg-[#15803D] hover:bg-[#166534] text-white font-headline-sm text-headline-sm shadow-sm inline-flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
						>
							<span class="material-symbols-outlined text-[20px]">check_circle</span>
							Approve Invoice
						</button>
						<button
							formaction="?/reject"
							type="submit"
							disabled={!isReviewable(invoice.status)}
							class="px-5 py-2.5 rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] text-white font-headline-sm text-headline-sm shadow-sm inline-flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
						>
							<span class="material-symbols-outlined text-[20px]">cancel</span>
							Reject Invoice
						</button>
					</div>
					<div class="flex items-center gap-space-sm">
						<button
							class="px-4 py-2.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high font-label-md text-label-md font-semibold inline-flex items-center gap-2 transition-colors"
							type="button"
						>
							<span class="material-symbols-outlined text-[18px]">outgoing_mail</span>
							Request Vendor Clarification
						</button>
						<button
							class="p-2.5 rounded-lg bg-surface-container text-secondary hover:text-on-surface hover:bg-surface-container-high transition-colors"
							type="button"
							title="Export Diagnostic JSON"
						>
							<span class="material-symbols-outlined text-[20px]">data_object</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	</form>

	<!-- Audit Trail Section -->
	<div class="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden mb-gutter">
		<div class="p-space-lg flex items-center justify-between">
			<div>
				<h2 class="font-headline-sm text-headline-sm text-on-surface">Immutable Audit Trail</h2>
				<p class="font-body-sm text-body-sm text-secondary mt-0.5">Chronological record of automated pipelines and user reviewer telemetry</p>
			</div>
			<span class="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
				<span class="material-symbols-outlined text-[16px] text-primary">security</span>
				Tamper-Evident SHA-256 Ledger
			</span>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-left">
				<thead class="bg-surface-container-low text-secondary font-label-sm text-label-sm uppercase tracking-wider">
					<tr>
						<th class="py-space-sm px-space-lg">Timestamp (UTC)</th>
						<th class="py-space-sm px-space-lg">Event</th>
						<th class="py-space-sm px-space-lg">Actor</th>
						<th class="py-space-sm px-space-lg">Details & Payload Digest</th>
					</tr>
				</thead>
				<tbody class="divide-y-0 text-body-sm text-body-sm">
					{#each audit as entry}
						<tr class="hover:bg-surface-container-low/40 transition-colors">
							<td class="py-space-sm px-space-lg font-numeric-table text-numeric-table text-secondary whitespace-nowrap">
								{entry.ts?.slice(0, 19).replace('T', ' ')} UTC
							</td>
							<td class="py-space-sm px-space-lg font-body-md text-body-md text-on-surface font-medium">{entry.event}</td>
							<td class="py-space-sm px-space-lg text-secondary">{entry.actor}</td>
							<td class="py-space-sm px-space-lg text-on-surface-variant font-numeric-table text-numeric-table">
								{entry.meta ? JSON.stringify(entry.meta).slice(0, 60) : '—'}
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="4" class="py-space-sm px-space-lg text-secondary text-center">No audit entries yet.</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<!-- PDF Modal Viewer Overlay -->
	{#if showPdfModal}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/60 backdrop-blur-sm p-margin" onclick={() => (showPdfModal = false)}>
			<div
				class="bg-surface-container-lowest rounded-xl shadow-2xl w-full max-w-4xl max-h-[921px] flex flex-col overflow-hidden"
				onclick={(e) => e.stopPropagation()}
			>
				<div class="px-space-lg py-space-md bg-surface-container-low flex items-center justify-between">
					<div class="flex items-center gap-2">
						<span class="material-symbols-outlined text-primary text-[20px]">picture_as_pdf</span>
						<span class="font-headline-sm text-headline-sm text-on-surface">{invoice.original_filename}</span>
						<span class="text-secondary font-label-sm text-label-sm">Rendered preview</span>
					</div>
					<button
						class="p-1 rounded text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
						type="button"
						onclick={() => (showPdfModal = false)}
					>
						<span class="material-symbols-outlined text-[22px]">close</span>
					</button>
				</div>
				<div class="p-space-xl overflow-y-auto flex-1 bg-surface-container-low/30 flex justify-center">
					<!-- Rendered invoice facsimile simulation -->
					<div class="w-full max-w-2xl bg-surface-container-lowest p-space-2xl rounded-lg shadow-md font-body-sm text-body-sm text-on-surface space-y-space-lg">
						<div class="flex justify-between items-start">
							<div>
								<h3 class="font-headline-lg text-headline-lg font-bold text-on-surface">{invoice.vendor_name}</h3>
								<p class="text-secondary font-body-sm text-body-sm">Currency: {invoice.currency ?? '—'}</p>
							</div>
							<div class="text-right">
								<span class="font-headline-sm text-headline-sm text-secondary uppercase">TAX INVOICE</span>
								<p class="font-headline-sm text-headline-sm text-on-surface font-bold">{invoice.invoice_number}</p>
								<p class="text-secondary font-body-sm text-body-sm">Date: {dateLabel(invoice.invoice_date)}</p>
							</div>
						</div>
						<div class="p-space-md rounded bg-surface-container-low">
							<span class="font-label-sm text-label-sm text-secondary uppercase">Billed To:</span>
							<p class="font-body-md text-body-md font-semibold text-on-surface">Acme Corporation Inc.</p>
							<p class="text-secondary font-body-sm text-body-sm">PO Number: {dateLabel(invoice.po_number)} (Pre-authorized)</p>
						</div>
						<div class="space-y-2 pt-2">
							<div class="flex justify-between font-label-sm text-label-sm uppercase text-secondary pb-1">
								<span>Item Description</span>
								<span>Amount</span>
							</div>
							{#each lines as line}
								<div class="flex justify-between py-1">
									<span>{line.description}</span>
									<span class="font-numeric-table text-numeric-table font-semibold">{money(line.amount)}</span>
								</div>
							{/each}
						</div>
						<div class="pt-4 flex flex-col items-end gap-1">
							<div class="flex justify-between w-48 text-secondary">
								<span>Subtotal:</span>
								<span class="font-numeric-table text-numeric-table text-on-surface">{money(invoice.subtotal)}</span>
							</div>
							<div class="flex justify-between w-48 text-secondary">
								<span>Tax{taxPct ? ` (${taxPct}%)` : ''}:</span>
								<span class="font-numeric-table text-numeric-table text-on-surface">{money(invoice.tax)}</span>
							</div>
							<div class="flex justify-between w-48 font-headline-sm text-headline-sm text-on-surface font-bold pt-2">
								<span>Total:</span>
								<span class="tabular-nums text-primary">{money(invoice.total)}</span>
							</div>
						</div>
					</div>
				</div>
				<div class="p-space-md bg-surface-container-low flex justify-end gap-space-sm">
					<button
						class="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold transition-colors flex items-center gap-1"
						type="button"
						onclick={() => window.print()}
					>
						<span class="material-symbols-outlined text-[16px]">print</span>
						Print Preview
					</button>
					<button
						class="px-4 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed-variant font-label-md text-label-md font-semibold transition-colors"
						type="button"
						onclick={() => (showPdfModal = false)}
					>
						Done
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

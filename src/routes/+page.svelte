<script lang="ts">
	import { enhance } from '$app/forms'
	import { invalidateAll } from '$app/navigation'
	import { goto } from '$app/navigation'

	let { data, form } = $props()
	const invoices: any[] = $derived((data?.invoices ?? []).slice())

	let filter = $state('all')
	let pendingProcess = $state<string[]>([])
	const processedSet = new Set<string>()
	let statusText = $state('')
	let showEmpty = $state(false)
	let fileInput: HTMLInputElement

	const stats = $derived({
		total: invoices.length,
		needs_review: invoices.filter((i) => i.status === 'needs_review').length,
		flagged: invoices.filter((i) => i.status === 'flagged').length,
		approved: invoices.filter((i) => i.status === 'approved').length,
	})

	const filtered = $derived(
		invoices.filter((i) => {
			if (filter === 'all') return true
			if (filter === 'review') return i.status === 'needs_review'
			return i.status === filter
		})
	)

	function failedChecks(validationJson: any, blocking: boolean) {
		if (!Array.isArray(validationJson)) return 0
		return validationJson.filter((c: any) => c.status === 'fail' && (blocking ? c.severity === 'blocking' : true)).length
	}
	function blockingCount(validationJson: any) {
		return failedChecks(validationJson, true)
	}
	function warningCount(validationJson: any) {
		return failedChecks(validationJson, false) - failedChecks(validationJson, true)
	}
	function money(n: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0)
	}
	function uploadedAgo(i: any) {
		const d = new Date(i.created ?? '')
		const now = new Date()
		const mins = Math.floor((now.getTime() - d.getTime()) / 60000)
		if (mins < 60) return `${mins} mins ago`
		const hours = Math.floor(mins / 60)
		if (hours < 24) return `${hours} hours ago`
		const days = Math.floor(hours / 24)
		if (days === 1) return 'Yesterday'
		return `${days} days ago`
	}
	function vendorInitial(name: string | null | undefined) {
		return (name ?? '?').charAt(0).toUpperCase()
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

	async function runProcess(ids: string[]) {
		pendingProcess = ids
		for (let i = 0; i < ids.length; i++) {
			statusText = `Processing ${i + 1}/${ids.length} uploaded invoice file(s)...`
			try {
				await fetch(`/api/invoices/${ids[i]}/process`, { method: 'POST' })
			} catch {
				/* surface via next queue load */
			}
			await invalidateAll()
		}
		statusText = ''
		pendingProcess = []
	}

	function handleRefresh(e: MouseEvent) {
		e.stopPropagation()
		invalidateAll()
	}

	function handleCancel(e: MouseEvent) {
		e.stopPropagation()
		pendingProcess = []
		statusText = ''
	}

	function handleFileClick(e: MouseEvent) {
		e.stopPropagation()
		fileInput.click()
	}

	function handleTab(active: string) {
		filter = active
	}

	function tabCls(active: string) {
		const base = 'filter-tab px-3.5 py-1.5 rounded-lg font-label-md text-label-md transition-all shadow-sm'
		if (filter === active) return `${base} bg-surface-container-lowest text-on-surface`
		return `${base} text-secondary hover:text-on-surface`
	}

	$effect(() => {
		const ids = Array.isArray(form?.ids) ? (form.ids as string[]) : []
		if (ids.length && !ids.some((id) => processedSet.has(id))) {
			const next = ids.filter((id) => !processedSet.has(id))
			runProcess(next)
			next.forEach((id) => processedSet.add(id))
		}
	})
</script>

<svelte:head>
	<title>Invoice queue — LedgerLens</title>
</svelte:head>

<div class="w-full max-w-[1600px] mx-auto px-margin py-gutter-lg flex flex-col gap-space-xl">
	<!-- Top Context & Header Row -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
		<div class="flex flex-col gap-space-xs">
			<div class="flex items-center gap-2">
				<span class="font-headline-lg text-headline-lg text-on-surface">Invoice queue</span>
				<span class="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">
					Batch AP v2.4
				</span>
			</div>
			<p class="font-body-md text-body-md text-secondary">
				Upload PDF invoices. They are extracted, validated and GL-coded automatically.
			</p>
		</div>
		<div class="flex items-center gap-space-sm flex-wrap">
			<button
				class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-all shadow-sm font-label-md text-label-md"
				type="button"
				onclick={handleRefresh}
			>
				<span class="material-symbols-outlined text-[18px] text-primary transition-transform duration-500">sync</span>
				<span>Refresh Queue</span>
			</button>
			<div class="relative inline-block text-left">
				<button
					class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-all shadow-sm font-label-md text-label-md"
					type="button"
				>
					<span class="material-symbols-outlined text-[18px] text-secondary">tune</span>
					<span>Batch Actions</span>
					<span class="material-symbols-outlined text-[16px] text-secondary">expand_more</span>
				</button>
				<div class="hidden absolute right-0 mt-2 w-48 rounded-xl bg-surface-container-lowest shadow-xl p-1 z-30 font-body-sm text-body-sm">
					<button class="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container flex items-center gap-2 text-on-surface" type="button">
						<span class="material-symbols-outlined text-[16px] text-primary">check_circle</span>
						<span>Approve selected (0)</span>
					</button>
					<button class="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container flex items-center gap-2 text-on-surface" type="button">
						<span class="material-symbols-outlined text-[16px] text-error">flag</span>
						<span>Flag selected</span>
					</button>
					<button class="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container flex items-center gap-2 text-on-surface" type="button">
						<span class="material-symbols-outlined text-[16px] text-secondary">file_download</span>
						<span>Export selected CSV</span>
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Active Extraction Notification / Processing Strip -->
	{#if pendingProcess.length}
		<div class="relative overflow-hidden rounded-xl bg-primary-fixed text-on-primary-fixed p-space-md shadow-sm transition-all">
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm relative z-10">
				<div class="flex items-center gap-space-md min-w-0">
					<div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0 animate-spin">
						<span class="material-symbols-outlined text-[18px]">progress_activity</span>
					</div>
					<div class="flex flex-col min-w-0">
						<span class="font-headline-sm text-headline-sm leading-tight text-on-primary-fixed truncate">{statusText}</span>
						<span class="font-body-sm text-body-sm text-on-primary-fixed-variant truncate">
							Extracting line items, validating PO match, and predicting GL distribution codes.
						</span>
					</div>
				</div>
				<div class="flex items-center gap-space-md shrink-0">
					<div class="w-36 bg-surface-container-lowest/80 h-2 rounded-full overflow-hidden">
						<div class="bg-primary h-full rounded-full transition-all duration-300 w-2/5 animate-pulse"></div>
					</div>
					<button
						class="text-on-primary-fixed-variant hover:text-on-primary-fixed font-label-md text-label-md px-2 py-1 rounded bg-surface-container-lowest/40 hover:bg-surface-container-lowest/80 transition-colors"
						type="button"
						onclick={handleCancel}
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Metric Stat Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
		<div class="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
			<div class="flex items-start justify-between">
				<span class="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Total Invoices</span>
				<div class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
					<span class="material-symbols-outlined text-[20px]">folder_copy</span>
				</div>
			</div>
			<div class="mt-space-md flex flex-col">
				<span class="font-display-lg text-display-lg text-on-surface">{stats.total}</span>
				<div class="flex items-center gap-1.5 mt-1 text-secondary font-body-sm text-body-sm">
					<span class="material-symbols-outlined text-[16px]">inventory_2</span>
					<span>All active files in batch</span>
				</div>
			</div>
		</div>
		<div class="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
			<div class="flex items-start justify-between">
				<span class="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Needs Review</span>
				<span class="px-2 py-0.5 rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm">{stats.needs_review} pending</span>
			</div>
			<div class="mt-space-md flex flex-col">
				<span class="font-display-lg text-display-lg text-primary">{stats.needs_review}</span>
				<div class="flex items-center gap-1.5 mt-1 text-secondary font-body-sm text-body-sm">
					<span class="material-symbols-outlined text-[16px] text-primary">rate_review</span>
					<span>Awaiting reviewer sign-off</span>
				</div>
			</div>
		</div>
		<div class="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
			<div class="flex items-start justify-between">
				<span class="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Flagged</span>
				<span class="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm">{stats.flagged} high priority</span>
			</div>
			<div class="mt-space-md flex flex-col">
				<span class="font-display-lg text-display-lg text-error">{stats.flagged}</span>
				<div class="flex items-center gap-1.5 mt-1 text-secondary font-body-sm text-body-sm">
					<span class="material-symbols-outlined text-[16px] text-error">error</span>
					<span>Requires manual exception handling</span>
				</div>
			</div>
		</div>
		<div class="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
			<div class="flex items-start justify-between">
				<span class="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Approved</span>
				<span class="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">{stats.approved} cleared</span>
			</div>
			<div class="mt-space-md flex flex-col">
				<span class="font-display-lg text-display-lg text-on-surface">{stats.approved}</span>
				<div class="flex items-center gap-1.5 mt-1 text-secondary font-body-sm text-body-sm">
					<span class="material-symbols-outlined text-[16px] text-primary">verified</span>
					<span>Ready for ERP sync / payment batch</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Dropzone Area -->
	<form method="POST" action="?/upload" enctype="multipart/form-data" use:enhance>
		<div class="flex flex-col gap-space-sm">
			<div
				class={`relative rounded-xl bg-surface-container-low p-space-2xl text-center shadow-sm transition-all cursor-pointer ${showEmpty ? 'bg-surface-container-high' : 'hover:bg-surface-container-high'}`}
				id="dropzone"
				onclick={handleFileClick}
			>
				<input accept=".pdf" class="hidden" id="invoiceFileInput" name="files" multiple type="file" bind:this={fileInput} onchange={(e) => (e.target as HTMLInputElement).form?.requestSubmit()} />
				<div class="max-w-xl mx-auto flex flex-col items-center">
					<div class="w-14 h-14 rounded-2xl bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm mb-space-md group-hover:scale-105 transition-transform">
						<span class="material-symbols-outlined text-[32px]">cloud_upload</span>
					</div>
					<h2 class="font-headline-sm text-headline-sm text-on-surface">Drag PDF invoices here or click to browse</h2>
					<p class="font-body-sm text-body-sm text-secondary mt-1">
						Multiple PDFs, max 10 MB each • OCR Extraction + GL Auto-Match
					</p>
					<div class="mt-space-lg flex items-center gap-space-md flex-wrap justify-center">
						<button
							class="px-4 py-2 rounded-lg bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-label-md text-label-md inline-flex items-center gap-2 shadow-sm transition-colors"
							type="button"
							onclick={(e) => {
								e.stopPropagation()
								fileInput.click()
							}}
						>
							<span class="material-symbols-outlined text-[18px]">add_circle</span>
							<span>Select PDFs</span>
						</button>
						<span class="font-body-sm text-body-sm text-secondary">
							or press <kbd class="px-1.5 py-0.5 bg-surface-container-lowest text-on-surface rounded text-label-sm font-label-sm shadow-sm">Ctrl + U</kbd>
						</span>
					</div>
				</div>
			</div>

			{#if form?.errors?.length}
				<div class="rounded-lg bg-error-container text-on-error-container p-3 flex items-center justify-between shadow-sm" id="validationWarning">
					<div class="flex items-center gap-2 min-w-0 pr-2">
						<span class="material-symbols-outlined text-[20px] text-error shrink-0">warning</span>
						<span class="font-body-sm text-body-sm truncate">
							{#each form.errors as err}
								{err.name} — {err.error}
							{/each}
						</span>
					</div>
					<button
						class="shrink-0 text-on-error-container hover:opacity-70 p-1 rounded"
						type="button"
						onclick={(e) => {
							e.stopPropagation()
							fileInput.value = ''
						}}
					>
						<span class="material-symbols-outlined text-[18px]">close</span>
					</button>
				</div>
			{/if}
		</div>
	</form>

	<!-- Filter, Search and Filter Controls -->
	<div class="flex flex-col gap-space-md">
		<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
			<!-- Status Tabs -->
			<div class="inline-flex p-1 rounded-xl bg-surface-container self-start shadow-sm" id="tabGroup">
				<button class={tabCls('all')} data-filter="all" type="button" onclick={() => handleTab('all')}>
					<span>All</span>
					<span class="px-1.5 py-0.2 rounded-full bg-secondary-container text-on-secondary-container text-label-sm font-label-sm">{stats.total}</span>
				</button>
				<button class={tabCls('review')} data-filter="review" type="button" onclick={() => handleTab('review')}>
					<span>Needs review</span>
					<span class="px-1.5 py-0.2 rounded-full bg-primary-fixed text-primary text-label-sm font-label-sm">{stats.needs_review}</span>
				</button>
				<button class={tabCls('flagged')} data-filter="flagged" type="button" onclick={() => handleTab('flagged')}>
					<span>Flagged</span>
					<span class="px-1.5 py-0.2 rounded-full bg-error-container text-on-error-container text-label-sm font-label-sm">{stats.flagged}</span>
				</button>
				<button class={tabCls('approved')} data-filter="approved" type="button" onclick={() => handleTab('approved')}>
					<span>Approved</span>
					<span class="px-1.5 py-0.2 rounded-full bg-secondary-container text-on-secondary-container text-label-sm font-label-sm">{stats.approved}</span>
				</button>
			</div>
			<!-- Filter Selectors & Search Input -->
			<div class="flex items-center gap-space-sm flex-wrap">
				<div class="relative flex-1 sm:w-64">
					<span class="material-symbols-outlined text-[18px] text-secondary absolute left-3 top-2.5">search</span>
					<input
						class="w-full bg-surface-container-lowest pl-9 pr-3 py-2 rounded-lg text-on-surface font-body-sm text-body-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
						id="searchInput"
						placeholder="Search invoice #, vendor, PO..."
						type="text"
					/>
				</div>
				<div class="relative">
					<select class="appearance-none bg-surface-container-lowest text-on-surface font-label-md text-label-md pl-3 pr-8 py-2 rounded-lg shadow-sm focus:outline-none cursor-pointer">
						<option>All Vendors</option>
					</select>
					<span class="material-symbols-outlined text-[16px] text-secondary absolute right-2.5 top-2.5 pointer-events-none">expand_more</span>
				</div>
				<div class="relative">
					<select class="appearance-none bg-surface-container-lowest text-on-surface font-label-md text-label-md pl-3 pr-8 py-2 rounded-lg shadow-sm focus:outline-none cursor-pointer">
						<option>Amount: Any</option>
						<option>&lt; $5,000</option>
						<option>$5,000 - $20,000</option>
						<option>&gt; $20,000</option>
					</select>
					<span class="material-symbols-outlined text-[16px] text-secondary absolute right-2.5 top-2.5 pointer-events-none">expand_more</span>
				</div>
				<button
					class="px-2.5 py-2 rounded-lg bg-surface-container text-secondary hover:text-on-surface font-label-sm text-label-sm flex items-center gap-1 transition-colors"
					id="toggleEmptyStateBtn"
					title="Toggle simulation view"
					type="button"
					onclick={() => (showEmpty = !showEmpty)}
				>
					<span class="material-symbols-outlined text-[16px]">visibility</span>
					<span class="hidden sm:inline">Toggle Empty View</span>
				</button>
			</div>
		</div>

		{#if showEmpty && filtered.length === 0}
			<!-- Empty State View -->
			<div class="rounded-xl bg-surface-container-lowest p-space-2xl text-center shadow-sm flex flex-col items-center justify-center" id="emptyStateContainer">
				<div class="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-secondary mb-space-md">
					<span class="material-symbols-outlined text-[36px]">inventory_2</span>
				</div>
				<h3 class="font-headline-sm text-headline-sm text-on-surface">No invoices in this queue</h3>
				<p class="font-body-sm text-body-sm text-secondary mt-1 max-w-sm">
					No invoices yet. Upload a PDF to get started or clear your filter criteria to see all processed documents.
				</p>
				<button
					class="mt-space-lg px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md inline-flex items-center gap-2 shadow-sm hover:bg-on-primary-fixed-variant transition-colors"
					type="button"
					onclick={(e) => {
						e.stopPropagation()
						fileInput.click()
					}}
				>
					<span class="material-symbols-outlined text-[18px]">upload</span>
					<span>Upload First Invoice</span>
				</button>
			</div>
		{:else}
			<!-- Data Table Surface -->
			<div class="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden flex flex-col" id="tableContainer">
				<div class="overflow-x-auto">
					<table class="w-full text-left min-w-[900px]">
						<thead>
							<tr class="bg-surface-container text-secondary font-label-sm text-label-sm uppercase tracking-wider">
								<th class="py-3 px-4 w-12 text-center" scope="col">
									<input class="rounded accent-primary cursor-pointer w-4 h-4" id="selectAllCheckbox" type="checkbox" />
								</th>
								<th class="py-3 px-4 font-label-sm text-label-sm" scope="col">Invoice #</th>
								<th class="py-3 px-4 font-label-sm text-label-sm" scope="col">Vendor</th>
								<th class="py-3 px-4 font-label-sm text-label-sm text-right" scope="col">Total</th>
								<th class="py-3 px-4 font-label-sm text-label-sm" scope="col">Status</th>
								<th class="py-3 px-4 font-label-sm text-label-sm" scope="col">Issues / Flags</th>
								<th class="py-3 px-4 font-label-sm text-label-sm" scope="col">Uploaded</th>
								<th class="py-3 px-4 font-label-sm text-label-sm text-right" scope="col">Actions</th>
							</tr>
						</thead>
						<tbody class="font-body-sm text-body-sm text-on-surface" id="invoiceTableBody">
							{#each filtered as invoice}
								<tr
									class="invoice-row hover:bg-surface-container transition-colors group cursor-pointer"
									data-status={invoice.status === 'needs_review' ? 'review' : invoice.status}
									onclick={() => goto(`/invoices/${invoice.id}`)}
								>
									<td class="py-3.5 px-4 text-center">
										<input class="row-check rounded accent-primary cursor-pointer w-4 h-4" type="checkbox" />
									</td>
									<td class="py-3.5 px-4 font-numeric-table text-numeric-table font-semibold text-primary">
										{invoice.invoice_number ?? '—'}
									</td>
									<td class="py-3.5 px-4">
										<div class="flex items-center gap-2">
											<div class="w-6 h-6 rounded bg-primary-fixed flex items-center justify-center font-label-sm text-label-sm text-primary font-bold">
												{vendorInitial(invoice.vendor_name)}
											</div>
											<span class="font-medium text-on-surface">{invoice.vendor_name ?? '—'}</span>
										</div>
									</td>
									<td class="py-3.5 px-4 text-right font-numeric-table text-numeric-table font-semibold text-on-surface">
										{money(invoice.total)}
									</td>
									<td class="py-3.5 px-4">
										<span class={statusChipCls(invoice.status)}>{statusLabel(invoice.status)}</span>
									</td>
									<td class="py-3.5 px-4">
										{#if blockingCount(invoice.validation_json) > 0}
											<div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-error-container text-on-error-container font-label-sm text-label-sm">
												<span class="material-symbols-outlined text-[14px]">error</span>
												<span>{blockingCount(invoice.validation_json)} blocking</span>
											</div>
										{:else if warningCount(invoice.validation_json) > 0}
											<div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-tertiary-fixed text-tertiary font-label-sm text-label-sm">
												<span class="material-symbols-outlined text-[14px]">warning</span>
												<span>{warningCount(invoice.validation_json)} warning</span>
											</div>
										{:else}
											<span class="text-secondary font-label-sm text-label-sm">—</span>
										{/if}
									</td>
									<td class="py-3.5 px-4 text-secondary font-body-sm text-body-sm">
										{uploadedAgo(invoice)}
									</td>
									<td class="py-3.5 px-4 text-right">
										<button
											class="inline-flex items-center gap-1 px-3 py-1 rounded bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-label-md text-label-md transition-colors shadow-sm"
											type="button"
											onclick={(e) => {
												e.stopPropagation()
												goto(`/invoices/${invoice.id}`)
											}}
										>
											<span>Review</span>
											<span class="material-symbols-outlined text-[14px]">arrow_forward</span>
										</button>
									</td>
								</tr>
							{:else}
								<tr>
									<td colspan="8" class="py-8 text-center text-[#5B6577]">No invoices yet. Upload a PDF to get started.</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				<!-- Table Footer / Pagination -->
				<div class="p-space-md bg-surface-container-lowest flex flex-col sm:flex-row items-center justify-between gap-space-sm">
					<span class="font-body-sm text-body-sm text-secondary">
						Showing <strong class="text-on-surface">1 to {filtered.length}</strong> of <strong class="text-on-surface">{invoices.length}</strong> invoices
					</span>
					<div class="flex items-center gap-1 font-label-md text-label-md">
						<button class="px-2.5 py-1.5 rounded-lg bg-surface-container text-secondary hover:text-on-surface disabled:opacity-40 transition-colors" disabled type="button">
							Previous
						</button>
						<button class="w-8 h-8 rounded-lg bg-primary text-on-primary font-bold">1</button>
						<button class="w-8 h-8 rounded-lg text-secondary hover:bg-surface-container transition-colors" type="button">2</button>
						<button class="w-8 h-8 rounded-lg text-secondary hover:bg-surface-container transition-colors" type="button">3</button>
						<button class="w-8 h-8 rounded-lg text-secondary hover:bg-surface-container transition-colors" type="button">4</button>
						<button class="px-2.5 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors" type="button">
							Next
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Reviewer Fast-Batch Keyboard Action Bar -->
	<div class="sticky bottom-6 z-20 self-center max-w-2xl w-full bg-inverse-surface text-inverse-on-surface rounded-xl shadow-xl px-space-lg py-3 flex items-center justify-between gap-space-md">
		<div class="flex items-center gap-2 min-w-0">
			<span class="material-symbols-outlined text-[20px] text-primary-fixed">keyboard</span>
			<span class="font-label-sm text-label-sm text-inverse-on-surface hidden sm:inline">AP Hotkeys:</span>
			<div class="flex items-center gap-1.5 font-label-sm text-label-sm">
				<span class="bg-surface-variant/20 px-1.5 py-0.5 rounded text-inverse-on-surface">[A] Approve</span>
				<span class="bg-surface-variant/20 px-1.5 py-0.5 rounded text-inverse-on-surface">[F] Flag</span>
				<span class="bg-surface-variant/20 px-1.5 py-0.5 rounded text-inverse-on-surface">[S] Skip</span>
			</div>
		</div>
		<div class="flex items-center gap-2 shrink-0">
			<span class="font-body-sm text-body-sm text-secondary-fixed" id="selectedCountBadge">0 selected</span>
			<button class="px-3 py-1 bg-primary text-on-primary rounded font-label-md text-label-md hover:bg-on-primary-fixed-variant transition-colors" type="button">
				Batch Sign-off
			</button>
		</div>
	</div>
</div>

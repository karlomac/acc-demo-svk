<script lang="ts">
	import { enhance, deserialize } from '$app/forms'
	import { invalidateAll } from '$app/navigation'
	import { goto } from '$app/navigation'

	let { data, form } = $props()
	const invoices: any[] = $derived((data?.invoices ?? []).slice())

	let filter = $state('all')
	let search = $state('')
	let vendorFilter = $state('all')
	let amountFilter = $state('any')
	let statusFilter = $state('all')
	let page = $state(1)
	let pageSize = $state(6)
	let selected = $state<string[]>([])
	let batchBusy = $state(false)
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

	const vendors = $derived(
		[...new Set(invoices.map((i) => i.vendor_name).filter(Boolean))].sort() as string[]
	)

	const filtered = $derived(
		invoices.filter((i) => {
			if (filter === 'review' && i.status !== 'needs_review') return false
			if (filter === 'flagged' && i.status !== 'flagged') return false
			if (filter === 'approved' && i.status !== 'approved') return false
			if (statusFilter !== 'all' && i.status !== statusFilter) return false
			if (vendorFilter !== 'all' && i.vendor_name !== vendorFilter) return false
			const total = Number(i.total ?? 0)
			if (amountFilter === 'lt5000' && total >= 5000) return false
			if (amountFilter === '5to20' && (total < 5000 || total > 20000)) return false
			if (amountFilter === 'gt20000' && total <= 20000) return false
			const q = search.trim().toLowerCase()
			if (q) {
				const hay = `${i.invoice_number ?? ''} ${i.vendor_name ?? ''} ${i.po_number ?? ''}`.toLowerCase()
				if (!hay.includes(q)) return false
			}
			return true
		})
	)

	const totalPages = $derived(Math.max(1, Math.ceil(filtered.length / pageSize)))
	const currentPage = $derived(Math.min(page, totalPages))
	const pageRows = $derived(filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize))
	const rangeStart = $derived(filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1)
	const rangeEnd = $derived(Math.min(currentPage * pageSize, filtered.length))
	const pageButtons = $derived.by(() => {
		const total = totalPages
		if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1) as (number | string)[]
		const out: (number | string)[] = [1]
		const start = Math.max(2, currentPage - 1)
		const end = Math.min(total - 1, currentPage + 1)
		if (start > 2) out.push('…')
		for (let i = start; i <= end; i++) out.push(i)
		if (end < total - 1) out.push('…')
		out.push(total)
		return out
	})

	const allOnPage = $derived(
		pageRows.length > 0 && pageRows.every((i: any) => selected.includes(i.id))
	)

	function toggleAll(checked: boolean) {
		selected = checked ? pageRows.map((i: any) => i.id) : []
	}

	async function runBatch(action: 'approve' | 'flag') {
		if (selected.length === 0 || batchBusy) return
		batchBusy = true
		const fd = new FormData()
		fd.append('action', action)
		for (const id of selected) fd.append('ids', id)
		try {
			const res = await fetch('?/batch', { method: 'POST', body: fd })
			const result = deserialize(await res.text())
			if (result.type === 'failure') {
				alert((result.data as { error?: string })?.error ?? 'Batch action failed')
			} else if (result.type === 'success') {
				const skipped = (result.data as { skipped?: unknown[] })?.skipped ?? []
				if (skipped.length > 0) {
					alert(`${skipped.length} invoice(s) skipped — not in a reviewable state.`)
				}
			}
		} finally {
			selected = []
			batchBusy = false
			await invalidateAll()
		}
	}

	function skipSelected() {
		selected = []
	}

	function onKeydown(e: KeyboardEvent) {
		const t = e.target as HTMLInputElement | null
		const typing =
			t &&
			(t.tagName === 'TEXTAREA' ||
				t.tagName === 'SELECT' ||
				t.isContentEditable ||
				(t.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'submit'].includes(t.type)))
		if (typing) return
		if (e.metaKey || e.ctrlKey || e.altKey) return
		if (selected.length === 0) return
		const key = e.key.toLowerCase()
		if (key === 'a') {
			e.preventDefault()
			runBatch('approve')
		} else if (key === 'f') {
			e.preventDefault()
			runBatch('flag')
		} else if (key === 's') {
			e.preventDefault()
			skipSelected()
		}
	}

	const filtersActive = $derived(
		filter !== 'all' || statusFilter !== 'all' || vendorFilter !== 'all' || amountFilter !== 'any' || search.trim() !== ''
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
		filter
		search
		vendorFilter
		amountFilter
		statusFilter
		pageSize
		page = 1
	})

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
						bind:value={search}
					/>
				</div>
				<div class="relative">
					<select
						class="appearance-none bg-surface-container-lowest text-on-surface font-label-md text-label-md pl-3 pr-8 py-2 rounded-lg shadow-sm focus:outline-none cursor-pointer"
						bind:value={statusFilter}
					>
						<option value="all">Status: All</option>
						<option value="uploaded">Uploaded</option>
						<option value="processing">Processing</option>
						<option value="needs_review">Needs review</option>
						<option value="flagged">Flagged</option>
						<option value="approved">Approved</option>
						<option value="rejected">Rejected</option>
						<option value="error">Error</option>
					</select>
					<span class="material-symbols-outlined text-[16px] text-secondary absolute right-2.5 top-2.5 pointer-events-none">expand_more</span>
				</div>
				<div class="relative">
					<select
						class="appearance-none bg-surface-container-lowest text-on-surface font-label-md text-label-md pl-3 pr-8 py-2 rounded-lg shadow-sm focus:outline-none cursor-pointer"
						bind:value={vendorFilter}
					>
						<option value="all">All Vendors</option>
						{#each vendors as vendor}
							<option value={vendor}>{vendor}</option>
						{/each}
					</select>
					<span class="material-symbols-outlined text-[16px] text-secondary absolute right-2.5 top-2.5 pointer-events-none">expand_more</span>
				</div>
				<div class="relative">
					<select
						class="appearance-none bg-surface-container-lowest text-on-surface font-label-md text-label-md pl-3 pr-8 py-2 rounded-lg shadow-sm focus:outline-none cursor-pointer"
						bind:value={amountFilter}
					>
						<option value="any">Amount: Any</option>
						<option value="lt5000">&lt; $5,000</option>
						<option value="5to20">$5,000 - $20,000</option>
						<option value="gt20000">&gt; $20,000</option>
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

		{#if showEmpty}
			<!-- Empty State View -->
			<div class="rounded-xl bg-surface-container-lowest p-space-2xl text-center shadow-sm flex flex-col items-center justify-center" id="emptyStateContainer">
				<div class="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-secondary mb-space-md">
					<span class="material-symbols-outlined text-[36px]">inventory_2</span>
				</div>
				<h3 class="font-headline-sm text-headline-sm text-on-surface">No invoices in this queue</h3>
				<p class="font-body-sm text-body-sm text-secondary mt-1 max-w-sm">
					{#if filtersActive}
						No invoices match your search or filters. Clear the filters to see all processed documents.
					{:else}
						No invoices yet. Upload a PDF to get started.
					{/if}
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
									<input
										class="rounded accent-primary cursor-pointer w-4 h-4"
										id="selectAllCheckbox"
										type="checkbox"
										checked={allOnPage}
										onchange={(e) => toggleAll((e.target as HTMLInputElement).checked)}
									/>
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
							{#each pageRows as invoice}
								<tr
									class="invoice-row hover:bg-surface-container transition-colors group cursor-pointer"
									data-status={invoice.status === 'needs_review' ? 'review' : invoice.status}
									onclick={() => goto(`/invoices/${invoice.id}`)}
								>
									<td class="py-3.5 px-4 text-center">
										<input
											class="row-check rounded accent-primary cursor-pointer w-4 h-4"
											type="checkbox"
											value={invoice.id}
											bind:group={selected}
											onclick={(e) => e.stopPropagation()}
										/>
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
										<div class="inline-flex items-center gap-1.5">
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
											<form method="POST" action="?/delete" use:enhance class="inline-flex">
												<input name="id" type="hidden" value={invoice.id} />
												<button
													class="p-1.5 rounded-lg text-secondary hover:text-error hover:bg-error-container transition-colors"
													type="submit"
													title="Delete invoice"
													onclick={(e) => {
														e.stopPropagation()
														if (
															!confirm(
																`Delete ${invoice.invoice_number || 'this invoice'}? It will be marked deleted at ${new Date().toLocaleString()} and hidden from the queue.`
															)
														) {
															e.preventDefault()
														}
													}}
												>
													<span class="material-symbols-outlined text-[18px]">delete</span>
												</button>
											</form>
										</div>
									</td>
								</tr>
							{:else}
								<tr>
									<td colspan="8" class="py-8 text-center text-[#5B6577]">
									{filtersActive ? 'No invoices match your search or filters.' : 'No invoices yet. Upload a PDF to get started.'}
								</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				<!-- Table Footer / Pagination -->
				<div class="p-space-md bg-surface-container-lowest flex flex-col sm:flex-row items-center justify-between gap-space-sm">
					<span class="font-body-sm text-body-sm text-secondary">
						Showing <strong class="text-on-surface">{rangeStart}–{rangeEnd}</strong> of <strong class="text-on-surface">{filtered.length}</strong> invoices
					</span>
					<div class="flex items-center gap-space-sm font-label-md text-label-md">
						<div class="relative">
							<select
								class="appearance-none bg-surface-container-lowest text-on-surface font-label-md text-label-md pl-3 pr-8 py-1.5 rounded-lg shadow-sm focus:outline-none cursor-pointer"
								bind:value={pageSize}
							>
								{#each [6, 10, 20, 50, 100] as size}
									<option value={size}>{size} / page</option>
								{/each}
							</select>
							<span class="material-symbols-outlined text-[16px] text-secondary absolute right-2.5 top-2 pointer-events-none">expand_more</span>
						</div>
						<div class="flex items-center gap-1">
							<button
								class="px-2.5 py-1.5 rounded-lg bg-surface-container text-secondary hover:text-on-surface disabled:opacity-40 transition-colors"
								disabled={currentPage === 1}
								onclick={() => (page = currentPage - 1)}
								type="button"
							>
								Previous
							</button>
							{#each pageButtons as b}
								{#if b === '…'}
									<span class="px-1 text-secondary">…</span>
								{:else}
									<button
										class={`w-8 h-8 rounded-lg transition-colors ${b === currentPage ? 'bg-primary text-on-primary font-bold' : 'text-secondary hover:bg-surface-container'}`}
										onclick={() => (page = b as number)}
										type="button"
									>
										{b}
									</button>
								{/if}
							{/each}
							<button
								class="px-2.5 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high disabled:opacity-40 transition-colors"
								disabled={currentPage === totalPages}
								onclick={() => (page = currentPage + 1)}
								type="button"
							>
								Next
							</button>
						</div>
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
				<button
					class="bg-surface-variant/20 px-1.5 py-0.5 rounded text-inverse-on-surface hover:bg-surface-variant/40 disabled:opacity-40 transition-colors"
					disabled={selected.length === 0 || batchBusy}
					onclick={() => runBatch('approve')}
					type="button"
				>
					[A] Approve
				</button>
				<button
					class="bg-surface-variant/20 px-1.5 py-0.5 rounded text-inverse-on-surface hover:bg-surface-variant/40 disabled:opacity-40 transition-colors"
					disabled={selected.length === 0 || batchBusy}
					onclick={() => runBatch('flag')}
					type="button"
				>
					[F] Flag
				</button>
				<button
					class="bg-surface-variant/20 px-1.5 py-0.5 rounded text-inverse-on-surface hover:bg-surface-variant/40 disabled:opacity-40 transition-colors"
					disabled={selected.length === 0}
					onclick={skipSelected}
					type="button"
				>
					[S] Skip
				</button>
			</div>
		</div>
		<div class="flex items-center gap-2 shrink-0">
			<span class="font-body-sm text-body-sm text-secondary-fixed" id="selectedCountBadge">{selected.length} selected</span>
			<button
				class="px-3 py-1 bg-primary text-on-primary rounded font-label-md text-label-md hover:bg-on-primary-fixed-variant disabled:opacity-40 transition-colors"
				disabled={selected.length === 0 || batchBusy}
				onclick={() => runBatch('approve')}
				type="button"
			>
				{batchBusy ? 'Working…' : 'Batch Sign-off'}
			</button>
		</div>
	</div>
</div>

<svelte:window onkeydown={onKeydown} />

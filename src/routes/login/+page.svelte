<script lang="ts">
	import { enhance } from '$app/forms'

	let { data, form } = $props()
	let copied = $state(false)

	async function copyEmail() {
		if (!data?.demoEmail) return
		try {
			await navigator.clipboard.writeText(data.demoEmail)
			copied = true
			setTimeout(() => (copied = false), 1800)
		} catch {
			copied = false
		}
	}
</script>

<svelte:head>
	<title>Enter the demo — LedgerLens</title>
</svelte:head>

<div class="min-h-screen flex flex-col items-center justify-center bg-surface p-margin gap-space-lg">
	<div class="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-sm p-6 sm:p-8 flex flex-col gap-space-xl">
		<div class="flex flex-col gap-space-sm">
			<div class="flex items-center justify-between">
				<div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container text-primary text-label-sm font-label-sm">
					<span class="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
					<span>Interactive Sandbox</span>
				</div>
				<span class="text-label-sm font-label-sm text-secondary tracking-wider uppercase font-semibold">v4.12</span>
			</div>
			<div class="flex flex-col gap-1 mt-1">
				<h1 class="text-headline-md font-headline-md text-on-surface tracking-tight">Enter the LedgerLens demo</h1>
				<p class="text-body-sm font-body-sm text-secondary">
					Experience deterministic accounts-payable verification in a live sandbox environment.
				</p>
			</div>
		</div>

		<form method="POST" action="?/demo" use:enhance class="flex flex-col gap-space-md">
			<div class="flex flex-col gap-1.5">
				<div class="flex items-center justify-between">
					<label class="text-label-md font-label-md text-on-surface" for="demo-email">Reviewer email</label>
					<span class="text-label-sm font-label-sm text-secondary">Read-only demo profile</span>
				</div>
				<div class="relative flex items-center">
					<input
						id="demo-email"
						class="w-full bg-surface-container-low text-on-surface font-numeric-table text-numeric-table rounded-lg pl-3 pr-20 py-2.5 outline-none"
						type="email"
						readonly
						value={data?.demoEmail ?? ''}
					/>
					<div class="absolute right-2 flex items-center gap-1">
						<button
							class="p-1 rounded text-secondary hover:text-on-surface hover:bg-surface-container transition-colors flex items-center"
							onclick={copyEmail}
							title="Copy email"
							type="button"
						>
							<span class="material-symbols-outlined text-[17px]">{copied ? 'check' : 'content_copy'}</span>
						</button>
						<span class="flex items-center text-primary-container" title="Verified Demo User">
							<span class="material-symbols-outlined text-[18px]">verified</span>
						</span>
					</div>
				</div>
			</div>

			<div class="flex flex-col gap-1.5">
				<div class="flex items-center justify-between">
					<label class="text-label-md font-label-md text-on-surface" for="demo-password">Demo key / Password</label>
					<span class="text-label-sm font-label-sm text-secondary">Auto-authenticated</span>
				</div>
				<input
					id="demo-password"
					class="w-full bg-surface-container-low text-on-surface font-numeric-table text-numeric-table rounded-lg pl-3 pr-3 py-2.5 outline-none tracking-widest"
					type="password"
					readonly
					value="demo-access"
				/>
			</div>

			<div class="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-low text-secondary text-label-sm font-label-sm">
				<span class="material-symbols-outlined text-[16px] text-primary-container">info</span>
				<span>The demo signs in with a read-only AP Specialist profile — no password needed.</span>
			</div>

			{#if form?.message}
				<p class="text-label-sm font-label-sm text-error">{form.message}</p>
			{/if}

			<div class="flex flex-col gap-2.5 pt-1">
				<button
					class="w-full h-10 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-body-md font-medium flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
					type="submit"
				>
					<span>Enter demo workspace</span>
					<span class="material-symbols-outlined text-[18px]">arrow_forward</span>
				</button>
				<a
					class="inline-flex items-center justify-center gap-1.5 py-1 text-label-md font-label-md text-secondary hover:text-primary transition-colors"
					href="/downloads/ledgerlens-sample-invoices.zip"
					download
				>
					<span class="material-symbols-outlined text-[16px]">sim_card_download</span>
					<span>Download sample vendor invoices (ZIP)</span>
				</a>
			</div>
		</form>

		<div class="flex flex-col gap-2.5 p-3.5 rounded-lg bg-surface-container-low">
			<div class="flex items-center justify-between">
				<span class="text-label-sm font-label-sm uppercase tracking-wider text-secondary font-semibold">What you will see</span>
				<span class="text-label-sm font-label-sm text-primary-container">3 Live Modules</span>
			</div>
			<div class="flex flex-col gap-2">
				<div class="flex items-start gap-2.5">
					<div class="mt-0.5 w-5 h-5 rounded flex items-center justify-center bg-surface-container text-primary-container shrink-0">
						<span class="material-symbols-outlined text-[14px]">receipt_long</span>
					</div>
					<div class="flex flex-col">
						<span class="text-label-md font-label-md text-on-surface">Invoice Queue</span>
						<span class="text-label-sm font-label-sm text-secondary">Ingestion status, batch dropzone and vendor invoices.</span>
					</div>
				</div>
				<div class="flex items-start gap-2.5">
					<div class="mt-0.5 w-5 h-5 rounded flex items-center justify-center bg-surface-container text-primary-container shrink-0">
						<span class="material-symbols-outlined text-[14px]">fact_check</span>
					</div>
					<div class="flex flex-col">
						<span class="text-label-md font-label-md text-on-surface">Exception Review</span>
						<span class="text-label-sm font-label-sm text-secondary">Line-by-line extraction, PO mismatch flags and GL auto-coding.</span>
					</div>
				</div>
				<div class="flex items-start gap-2.5">
					<div class="mt-0.5 w-5 h-5 rounded flex items-center justify-center bg-surface-container text-primary-container shrink-0">
						<span class="material-symbols-outlined text-[14px]">history_edu</span>
					</div>
					<div class="flex flex-col">
						<span class="text-label-md font-label-md text-on-surface">Audit Trail</span>
						<span class="text-label-sm font-label-sm text-secondary">Append-only chronological log with SHA-256 state validation.</span>
					</div>
				</div>
			</div>
		</div>

		<details class="text-label-sm font-label-sm text-secondary">
			<summary class="cursor-pointer hover:text-primary">Sign in with a reviewer account instead</summary>
			<form method="POST" action="?/login" use:enhance class="mt-3 flex flex-col gap-2">
				<input id="email" type="email" name="email" required placeholder="Email" class="w-full rounded-lg border border-outline-variant px-3 py-2 text-on-surface" />
				<input id="password" type="password" name="password" required placeholder="Password" class="w-full rounded-lg border border-outline-variant px-3 py-2 text-on-surface" />
				<button type="submit" class="w-full bg-surface-container text-on-surface py-2 rounded-lg hover:bg-surface-container-high transition-colors">Sign in</button>
			</form>
		</details>

		<div class="flex items-center justify-center gap-1.5 text-center text-label-sm font-label-sm text-secondary">
			<span class="material-symbols-outlined text-[15px] text-outline">history</span>
			<span>Shared demo environment • Illustrative data</span>
		</div>
	</div>
</div>

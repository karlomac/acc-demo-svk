<script lang="ts">
	import '@fontsource-variable/inter'
	import './layout.css'
	import { enhance } from '$app/forms'
	import { page } from '$app/state'

	let { children, data } = $props()

	const user = $derived(data?.user)
	const initials = $derived(
		(user?.email ?? '?')
			.split('@')[0]
			.split(/[._-]/)
			.slice(0, 2)
			.map((p: string) => p.charAt(0).toUpperCase())
			.join('')
	)
	const isActive = (path: string) =>
		path === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(path)
</script>

{#if user}
<nav class="sticky top-0 z-20 bg-surface-container-lowest border-b border-outline-variant/40">
	<div class="w-full max-w-[1600px] mx-auto px-margin h-16 flex items-center justify-between gap-gutter">
		<div class="flex items-center gap-8 min-w-0">
			<a href="/queue" class="flex items-center gap-2 shrink-0">
				<span class="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center">
					<span class="material-symbols-outlined text-[20px]">menu_book</span>
				</span>
				<span class="font-headline-sm text-headline-sm text-on-surface tracking-tight">LedgerLens</span>
			</a>
			{#if user}
				<span class="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">
					AP Reviewer
				</span>
				<div class="hidden md:flex items-center gap-6 font-label-md text-label-md">
					<a
						href="/queue"
						class={`pb-1 border-b-2 transition-colors ${page.url.pathname === '/queue' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-primary'}`}
					>
						Invoices
					</a>
					<a
						href="/audit"
						class={`pb-1 border-b-2 transition-colors ${isActive('/audit') ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-primary'}`}
					>
						Audit Log
					</a>
					<a
						href="/api/export/approved"
						class="text-on-surface-variant hover:text-primary"
					>
						Export Approved CSV
					</a>
				</div>
			{/if}
		</div>

		{#if user}
			<div class="flex items-center gap-gutter">
				<span class="hidden lg:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-low text-on-surface-variant font-label-md text-label-md">
					<span class="relative flex h-2 w-2">
						<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
						<span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
					</span>
					Live Sync
				</span>
				<div class="flex items-center gap-2">
					<span class="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-label-sm font-semibold">
						{initials}
					</span>
					<div class="hidden sm:flex flex-col leading-tight">
						<span class="font-label-md text-label-md text-on-surface">{user.email}</span>
						<span class="font-label-sm text-label-sm text-on-surface-variant">AP Specialist</span>
					</div>
				</div>
				<form method="POST" action="/logout" use:enhance>
					<button
						type="submit"
						class="inline-flex items-center gap-1 font-label-md text-label-md text-on-surface-variant hover:text-error transition-colors"
					>
						<span class="material-symbols-outlined text-[18px]">logout</span>
						<span class="hidden sm:inline">Log out</span>
					</button>
				</form>
			</div>
		{/if}
	</div>
</nav>
{/if}

{@render children()}

{#if user}
	<footer class="w-full bg-surface-container-lowest border-t border-outline-variant/40 py-gutter mt-space-xl">
		<div class="w-full max-w-[1600px] mx-auto px-margin flex flex-col sm:flex-row items-center justify-between gap-space-sm text-on-surface-variant font-label-md text-label-md">
			<span>© 2025 LedgerLens Inc. Accounts Payable &amp; Ledger Automation.</span>
			<div class="flex items-center gap-gutter">
				<span class="flex items-center gap-1">
					<span class="material-symbols-outlined text-[16px]">verified_user</span>
					Tamper-evident audit chain
				</span>
				<span>Audit Trail v4.12</span>
			</div>
		</div>
	</footer>
{/if}

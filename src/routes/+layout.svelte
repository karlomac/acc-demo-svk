<script lang="ts">
	import { enhance } from '$app/forms'

	let { children, data } = $props()
</script>

<nav class="sticky top-0 z-20 bg-white border-b border-[#E3E6EB]">
	<div class="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<span class="font-semibold text-[#0F172A] tracking-tight">LedgerLens</span>
		</div>
		<div class="flex items-center gap-3">
			<a href="/" class="text-sm text-[#5B6577] hover:text-[#2554D6]">Invoices</a>
			<a href="/audit" class="text-sm text-[#5B6577] hover:text-[#2554D6]">Audit log</a>
			<a href="/api/export/approved" class="text-sm text-[#2554D6] hover:underline">Export approved CSV</a>
			<form method="POST" action="/logout" use:enhance>
				<button type="submit" class="text-sm text-[#5B6577] hover:text-[#B91C1C]">Log out</button>
			</form>
			<span class="text-sm text-[#0F172A]">{data?.user?.email}</span>
		</div>
	</div>
</nav>

<div class="max-w-7xl mx-auto px-6 py-4">
	{@render children()}
</div>

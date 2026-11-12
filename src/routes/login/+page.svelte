<script lang="ts">
	import { enhance } from '$app/forms'

	let { data, form } = $props()
</script>

<div class="min-h-screen flex items-center justify-center bg-[#F6F7F9] p-6">
	<div class="w-full max-w-md bg-white rounded-xl border border-[#E3E6EB] shadow-sm p-8">
		<h1 class="text-2xl font-semibold text-[#0F172A] mb-6">LedgerLens</h1>
		<h2 class="text-base font-medium text-[#0F172A] mb-4">Sign in</h2>
		<form method="POST" action="?/login" use:enhance class="space-y-4">
			<div>
				<label for="email" class="block text-sm text-[#5B6577] mb-1">Email</label>
				<input id="email" type="email" name="email" required class="w-full rounded border border-[#E3E6EB] px-3 py-2 text-[#0F172A]" />
			</div>
			<div>
				<label for="password" class="block text-sm text-[#5B6577] mb-1">Password</label>
				<input id="password" type="password" name="password" required class="w-full rounded border border-[#E3E6EB] px-3 py-2 text-[#0F172A]" />
			</div>
			{#if form?.message}
				<p class="text-sm text-[#B91C1C]">{form.message}</p>
			{/if}
			<button type="submit" class="w-full bg-[#2554D6] hover:bg-[#1B43B3] text-white py-2 rounded">Sign in</button>
		</form>
		{#if data?.showDemoHint}
			<p class="mt-6 text-xs text-[#5B6577]">Demo credentials: reviewer@ledgerlens.test / Demo-Reviewer-123!</p>
		{/if}
	</div>
</div>

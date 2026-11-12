<script lang="ts">
	let { label, value, class: className = '' } = $props()
</script>

<div class={`bg-white rounded-xl border border-[#E3E6EB] shadow-sm p-5 ${className}`}>
	<p class="text-sm text-[#5B6577]">{label}</p>
	<p class="text-xl font-semibold text-[#0F172A]">{value}</p>
</div>

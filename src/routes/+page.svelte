<script lang="ts">
	let { data } = $props()
	const demoEmail = $derived(data?.demoEmail ?? '')
	let copied = $state(false)

	async function copyEmail() {
		if (!demoEmail) return
		try {
			await navigator.clipboard.writeText(demoEmail)
			copied = true
			setTimeout(() => (copied = false), 1800)
		} catch {
			copied = false
		}
	}
</script>

<svelte:head>
	<title>LedgerLens — AI-Assisted Accounts Payable Invoice Review</title>
	<meta
		name="description"
		content="LedgerLens extracts, validates and GL-codes high-volume vendor invoices before payment runs. Try the live demo with 10 intentionally flawed sample invoices."
	/>
	<meta name="color-scheme" content="light" />
</svelte:head>

<div class="min-h-screen flex flex-col bg-[#FAFBFC] text-[#0F172A]">
<!-- 1) Sticky Top Nav -->
  <header class="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#E3E6EB] transition-colors">
    <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <!-- Left Brand -->
      <a href="/" class="flex items-center gap-2.5 text-[#0F172A] font-semibold text-lg tracking-tight hover:opacity-90">
        <div class="w-8 h-8 rounded-lg bg-[#EFF4FF] border border-[#C7D9FE] flex items-center justify-center text-[#2554D6]">
          <span class="material-symbols-outlined text-[20px]">menu_book</span>
        </div>
        <span>LedgerLens</span>
      </a>

      <!-- Center Links -->
      <nav aria-label="Main Navigation" class="hidden md:flex items-center gap-8 text-sm font-medium text-[#5B6577]">
        <a href="#problem" class="hover:text-[#0F172A] transition-colors">Problem</a>
        <a href="#how-it-works" class="hover:text-[#0F172A] transition-colors">How it works</a>
        <a href="#validation" class="hover:text-[#0F172A] transition-colors">Validation</a>
        <a href="#roadmap" class="hover:text-[#0F172A] transition-colors">Roadmap</a>
      </nav>

      <!-- Right CTAs -->
      <div class="flex items-center gap-3">
        <a href="/downloads/ledgerlens-sample-invoices.zip" download class="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs md:text-sm font-medium text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg border border-[#E3E6EB] transition-colors">
          <span class="material-symbols-outlined text-[18px] text-[#5B6577]">download</span>
          <span>Download sample invoices</span>
        </a>
        <a href="/login" class="inline-flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-medium text-white bg-[#2554D6] hover:bg-[#1B43B3] rounded-lg shadow-sm transition-colors">
          <span>Open the demo</span>
          <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
        </a>
      </div>
    </div>
  </header>

  <main class="flex-1">

    <!-- 2) Hero Section -->
    <section class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        
        <!-- Hero Left -->
        <div class="lg:col-span-7 flex flex-col items-start">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#EFF4FF] border border-[#C7D9FE] text-[#1D4ED8] text-xs font-semibold uppercase tracking-wider mb-5">
            <span class="material-symbols-outlined text-[16px]">verified</span>
            <span>Accounts Payable Automation</span>
          </div>

          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0F172A] leading-[1.15] mb-6">
            Stop paying invoices you cannot verify.
          </h1>

          <p class="text-base sm:text-lg text-[#5B6577] leading-relaxed max-w-2xl mb-8">
            Extract, validate, and GL-code high-volume vendor invoices before payment runs. Catch purchase order overages, tax mismatches, and duplicate submissions with deterministic rule telemetry.
          </p>

          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mb-6">
            <a href="/login" class="px-5 py-3 text-sm font-medium text-white bg-[#2554D6] hover:bg-[#1B43B3] rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors">
              <span>Open the demo</span>
              <span class="material-symbols-outlined text-[18px]">launch</span>
            </a>
            <a href="/downloads/ledgerlens-sample-invoices.zip" download class="px-5 py-3 text-sm font-medium text-[#0F172A] bg-white hover:bg-[#F1F5F9] rounded-lg border border-[#E3E6EB] shadow-sm flex items-center justify-center gap-2 transition-colors">
              <span class="material-symbols-outlined text-[18px] text-[#5B6577]">download</span>
              <span>Download 10 sample invoices</span>
            </a>
          </div>

          <div class="flex items-center gap-2 text-xs text-[#5B6577]">
            <span class="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Demo environment · illustrative data</span>
          </div>
        </div>

        <!-- Hero Right: Live Review Card Mock -->
        <div class="lg:col-span-5 w-full">
          <div class="bg-white rounded-2xl border border-[#E3E6EB] shadow-sm p-5 md:p-6 transition-all hover:border-[#CBD5E1]">
            
            <!-- Mock Header -->
            <div class="flex items-start justify-between border-b border-[#E3E6EB] pb-4 mb-4">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs font-semibold text-[#5B6577] uppercase tracking-wider">Review Queue</span>
                  <span class="text-xs text-[#5B6577]">·</span>
                  <span class="text-xs font-mono font-medium text-[#0F172A]">INV-2024-098</span>
                </div>
                <h3 class="text-base font-semibold text-[#0F172A]">Stripe Payments UK</h3>
                <p class="text-xs text-[#5B6577]">Matched PO: <span class="font-mono text-[#0F172A]">PO-88219</span></p>
              </div>

              <div class="text-right">
                <span class="text-xs text-[#5B6577] block mb-0.5">Total Payable</span>
                <span class="text-xl font-bold tracking-tight text-[#0F172A] tabular-nums">$3,812.40</span>
              </div>
            </div>

            <!-- Status Chips -->
            <div class="flex flex-wrap gap-2 mb-4">
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#E7EEFF] text-[#1D4ED8] border border-[#C7D9FE]">
                <span class="material-symbols-outlined text-[14px]">pending_actions</span>
                <span>Needs review</span>
              </span>
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#FDECEC] text-[#B91C1C] border border-[#F87171]">
                <span class="material-symbols-outlined text-[14px]">cancel</span>
                <span>1 blocking</span>
              </span>
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#FFFBEB] text-[#B45309] border border-[#FCD34D]">
                <span class="material-symbols-outlined text-[14px]">warning</span>
                <span>1 warning</span>
              </span>
            </div>

            <!-- Line Item Breakdown Mock Table -->
            <div class="border border-[#E3E6EB] rounded-lg overflow-hidden mb-4">
              <table class="w-full text-left text-xs">
                <thead class="bg-[#F1F5F9] text-[#5B6577] font-semibold border-b border-[#E3E6EB]">
                  <tr>
                    <th scope="col" class="py-2 px-3">Description</th>
                    <th scope="col" class="py-2 px-3">GL Code</th>
                    <th scope="col" class="py-2 px-3 text-right">Confidence</th>
                    <th scope="col" class="py-2 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#E3E6EB]">
                  <tr class="hover:bg-[#FAFBFC]">
                    <td class="py-2.5 px-3 font-medium text-[#0F172A]">Platform Fee</td>
                    <td class="py-2.5 px-3 font-mono text-[#5B6577]">6100-20</td>
                    <td class="py-2.5 px-3 text-right text-emerald-700 font-semibold tabular-nums">98%</td>
                    <td class="py-2.5 px-3 text-right text-[#0F172A] tabular-nums font-medium">$2,100.00</td>
                  </tr>
                  <tr class="hover:bg-[#FAFBFC]">
                    <td class="py-2.5 px-3 font-medium text-[#0F172A]">Dispute Radar</td>
                    <td class="py-2.5 px-3 font-mono text-[#5B6577]">6100-25</td>
                    <td class="py-2.5 px-3 text-right text-emerald-700 font-semibold tabular-nums">94%</td>
                    <td class="py-2.5 px-3 text-right text-[#0F172A] tabular-nums font-medium">$890.00</td>
                  </tr>
                  <tr class="bg-[#FFFDF5] hover:bg-[#FFFBEB]">
                    <td class="py-2.5 px-3 font-medium text-[#B45309]">Custom Surcharge</td>
                    <td class="py-2.5 px-3 font-mono text-[#B45309]">6050-10</td>
                    <td class="py-2.5 px-3 text-right text-[#B91C1C] font-semibold tabular-nums">64% ⚠</td>
                    <td class="py-2.5 px-3 text-right text-[#0F172A] tabular-nums font-medium">$500.00</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Footer Micro-Action -->
            <div class="flex items-center justify-between pt-2 text-xs">
              <span class="text-[#5B6577] flex items-center gap-1">
                <span class="material-symbols-outlined text-[15px] text-[#2554D6]">shield</span>
                Rule check V006 failed: PO overage +$312.40
              </span>
              <span class="font-medium text-[#2554D6] hover:underline cursor-pointer">Inspect in queue →</span>
            </div>

          </div>
        </div>

      </div>
    </section>

    <!-- 3) Stat Strip -->
    <section class="border-y border-[#E3E6EB] bg-white py-12">
      <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          
          <!-- Stat 1 -->
          <div class="border-l-2 border-[#2554D6] pl-4">
            <span class="text-xs font-semibold uppercase tracking-wider text-[#5B6577] block mb-1">Files per upload</span>
            <div class="text-3xl lg:text-4xl font-bold tracking-tight text-[#0F172A] tabular-nums mb-1">20</div>
            <p class="text-xs text-[#5B6577]">10 MB PDF cap per file, validated on ingest</p>
          </div>

          <!-- Stat 2 -->
          <div class="border-l-2 border-[#2554D6] pl-4">
            <span class="text-xs font-semibold uppercase tracking-wider text-[#5B6577] block mb-1">Manual touch time</span>
            <div class="text-3xl lg:text-4xl font-bold tracking-tight text-[#0F172A] tabular-nums mb-1">-78%</div>
            <p class="text-xs text-[#5B6577]">Reviewers only examine flagged exceptions and overrides</p>
          </div>

          <!-- Stat 3 -->
          <div class="border-l-2 border-[#2554D6] pl-4">
            <span class="text-xs font-semibold uppercase tracking-wider text-[#5B6577] block mb-1">Duplicate payments caught</span>
            <div class="text-3xl lg:text-4xl font-bold tracking-tight text-[#0F172A] tabular-nums mb-1">100%</div>
            <p class="text-xs text-[#5B6577]">Zero undetected duplicate hashes before ERP commit</p>
          </div>

          <!-- Stat 4 -->
          <div class="border-l-2 border-[#2554D6] pl-4">
            <span class="text-xs font-semibold uppercase tracking-wider text-[#5B6577] block mb-1">First-pass PO match</span>
            <div class="text-3xl lg:text-4xl font-bold tracking-tight text-[#0F172A] tabular-nums mb-1">94.2%</div>
            <p class="text-xs text-[#5B6577]">Line items mapped directly to open vendor commitments</p>
          </div>

        </div>

        <div class="mt-8 pt-4 border-t border-[#E3E6EB] text-center sm:text-right">
          <span class="text-xs italic text-[#5B6577]">Illustrative figures for demo purposes.</span>
        </div>

      </div>
    </section>

    <!-- 4) The Situation (Case Study Section) -->
    <section id="problem" class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <div class="max-w-3xl mb-12">
        <span class="text-xs font-semibold text-[#2554D6] uppercase tracking-wider block mb-2">The Operational Reality</span>
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0F172A] mb-4">
          What massive invoice volume actually breaks
        </h2>
        <p class="text-base text-[#5B6577] leading-relaxed">
          High-volume accounts payable pipelines fail quietly. When AP teams are handling hundreds of monthly invoices under tight close deadlines, exhaustive line-by-line verification becomes physically impossible. Teams inadvertently approve bills with subtle rate creeps, mismatched PO balances, and split duplicates.
        </p>
      </div>

      <!-- 3 Breakdown Columns -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        
        <div class="bg-white p-6 rounded-2xl border border-[#E3E6EB] shadow-sm">
          <div class="w-10 h-10 rounded-lg bg-[#FDECEC] border border-[#F87171] text-[#B91C1C] flex items-center justify-center mb-4">
            <span class="material-symbols-outlined text-[22px]">keyboard</span>
          </div>
          <h3 class="text-base font-semibold text-[#0F172A] mb-2">Manual keying and re-keying</h3>
          <p class="text-xs sm:text-sm text-[#5B6577] leading-relaxed">
            Staff copy-paste dates, vendor names, and totals between PDF viewers and spreadsheets. Typographical errors trigger payment delays and tax return reconciliation discrepancies.
          </p>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-[#E3E6EB] shadow-sm">
          <div class="w-10 h-10 rounded-lg bg-[#FDECEC] border border-[#F87171] text-[#B91C1C] flex items-center justify-center mb-4">
            <span class="material-symbols-outlined text-[22px]">rule</span>
          </div>
          <h3 class="text-base font-semibold text-[#0F172A] mb-2">PO and GL mismatches found after approval</h3>
          <p class="text-xs sm:text-sm text-[#5B6577] leading-relaxed">
            Invoices get rubber-stamped without verifying remaining purchase order authorization ceilings or correct cost-center GL classifications, requiring messy journal entry reversals later.
          </p>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-[#E3E6EB] shadow-sm">
          <div class="w-10 h-10 rounded-lg bg-[#FDECEC] border border-[#F87171] text-[#B91C1C] flex items-center justify-center mb-4">
            <span class="material-symbols-outlined text-[22px]">history_edu</span>
          </div>
          <h3 class="text-base font-semibold text-[#0F172A] mb-2">Audit trail reconstructed after the fact</h3>
          <p class="text-xs sm:text-sm text-[#5B6577] leading-relaxed">
            When external auditors request proof of review, controllers scramble through email chains and Slack messages to confirm who signed off on specific overages.
          </p>
        </div>

      </div>

      <!-- Baseline vs. with LedgerLens Comparison Table -->
      <div class="bg-white rounded-2xl border border-[#E3E6EB] shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-[#E3E6EB] bg-[#FAFBFC]">
          <h3 class="text-sm font-semibold text-[#0F172A]">Baseline vs. with LedgerLens</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs sm:text-sm">
            <thead class="bg-[#F1F5F9] text-[#5B6577] font-semibold border-b border-[#E3E6EB]">
              <tr>
                <th scope="col" class="py-3.5 px-6 w-1/4">Workflow Stage</th>
                <th scope="col" class="py-3.5 px-6 w-3/8 text-[#B91C1C]">Baseline (Manual AP)</th>
                <th scope="col" class="py-3.5 px-6 w-3/8 text-[#15803D]">With LedgerLens</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E3E6EB]">
              <tr class="hover:bg-[#FAFBFC]">
                <td class="py-4 px-6 font-semibold text-[#0F172A]">Intake</td>
                <td class="py-4 px-6 text-[#5B6577]">Decentralized PDF attachments scattered across individual AP inboxes and network shared folders.</td>
                <td class="py-4 px-6 text-[#0F172A] font-medium">Batch drag-and-drop dropzone with instant file ingestion and size/readability validation.</td>
              </tr>
              <tr class="hover:bg-[#FAFBFC]">
                <td class="py-4 px-6 font-semibold text-[#0F172A]">Extraction</td>
                <td class="py-4 px-6 text-[#5B6577]">Manual typing of header data, invoice numbers, tax IDs, and individual line descriptions.</td>
                <td class="py-4 px-6 text-[#0F172A] font-medium">Automated OCR and table extraction pulling line items, taxes, and dates in seconds.</td>
              </tr>
              <tr class="hover:bg-[#FAFBFC]">
                <td class="py-4 px-6 font-semibold text-[#0F172A]">Validation</td>
                <td class="py-4 px-6 text-[#5B6577]">Spot-checking arithmetic and duplicate checks only when vendor balances visibly trigger alerts.</td>
                <td class="py-4 px-6 text-[#0F172A] font-medium">Deterministic verification engine executing V001–V007 rules before reviewer sign-off.</td>
              </tr>
              <tr class="hover:bg-[#FAFBFC]">
                <td class="py-4 px-6 font-semibold text-[#0F172A]">GL Coding</td>
                <td class="py-4 px-6 text-[#5B6577]">Memory-based manual selection from 300+ general ledger codes; high variance between staff.</td>
                <td class="py-4 px-6 text-[#0F172A] font-medium">Contextual AI-suggested GL distribution codes with transparent confidence ratings.</td>
              </tr>
              <tr class="hover:bg-[#FAFBFC]">
                <td class="py-4 px-6 font-semibold text-[#0F172A]">Audit Evidence</td>
                <td class="py-4 px-6 text-[#5B6577]">Incomplete email approvals, informal sign-offs, and retroactive spreadsheet notes.</td>
                <td class="py-4 px-6 text-[#0F172A] font-medium">Immutable, append-only chronological audit log cryptographically verifiable per action.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </section>

    <!-- 5) How It Works -->
    <section id="how-it-works" class="border-t border-[#E3E6EB] bg-white py-16 lg:py-24">
      <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div class="max-w-3xl mb-12">
          <span class="text-xs font-semibold text-[#2554D6] uppercase tracking-wider block mb-2">Process Architecture</span>
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0F172A] mb-4">
            From PDF to signed-off payment in five steps
          </h2>
          <p class="text-base text-[#5B6577]">
            LedgerLens establishes an automated pipeline where repetitive arithmetic, duplicate matching, and baseline validation run automatically, routing only verified data to human reviewers.
          </p>
        </div>

        <!-- 5 Steps Horizontal on Desktop / Vertical on Mobile -->
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4 lg:gap-6 mb-10">
          
          <!-- Step 1 -->
          <div class="bg-[#FAFBFC] border border-[#E3E6EB] rounded-2xl p-5 relative flex flex-col justify-between">
            <div>
              <div class="w-8 h-8 rounded-lg bg-[#EFF4FF] border border-[#C7D9FE] text-[#2554D6] flex items-center justify-center font-bold text-xs mb-3">
                1
              </div>
              <h3 class="text-sm font-semibold text-[#0F172A] mb-1">Upload batch</h3>
              <p class="text-xs text-[#5B6577] leading-relaxed">
                Multi-PDF ingestion with instant format and scan-quality checks.
              </p>
            </div>
            <div class="pt-4 mt-4 border-t border-[#E3E6EB] text-[#5B6577] flex items-center gap-1 text-[11px]">
              <span class="material-symbols-outlined text-[14px]">cloud_upload</span>
              <span>Concurrent batching</span>
            </div>
          </div>

          <!-- Step 2 -->
          <div class="bg-[#FAFBFC] border border-[#E3E6EB] rounded-2xl p-5 relative flex flex-col justify-between">
            <div>
              <div class="w-8 h-8 rounded-lg bg-[#EFF4FF] border border-[#C7D9FE] text-[#2554D6] flex items-center justify-center font-bold text-xs mb-3">
                2
              </div>
              <h3 class="text-sm font-semibold text-[#0F172A] mb-1">Extract line items</h3>
              <p class="text-xs text-[#5B6577] leading-relaxed">
                OCR parses headers, quantities, unit prices, subtotal, and tax.
              </p>
            </div>
            <div class="pt-4 mt-4 border-t border-[#E3E6EB] text-[#5B6577] flex items-center gap-1 text-[11px]">
              <span class="material-symbols-outlined text-[14px]">table_rows</span>
              <span>Table extraction</span>
            </div>
          </div>

          <!-- Step 3 -->
          <div class="bg-[#FAFBFC] border border-[#E3E6EB] rounded-2xl p-5 relative flex flex-col justify-between">
            <div>
              <div class="w-8 h-8 rounded-lg bg-[#EFF4FF] border border-[#C7D9FE] text-[#2554D6] flex items-center justify-center font-bold text-xs mb-3">
                3
              </div>
              <h3 class="text-sm font-semibold text-[#0F172A] mb-1">Validate against PO and GL</h3>
              <p class="text-xs text-[#5B6577] leading-relaxed">
                Rules engine verifies balance ceilings, mathematical consistency, and vendor IDs.
              </p>
            </div>
            <div class="pt-4 mt-4 border-t border-[#E3E6EB] text-[#5B6577] flex items-center gap-1 text-[11px]">
              <span class="material-symbols-outlined text-[14px]">fact_check</span>
              <span>V001–V009 suite</span>
            </div>
          </div>

          <!-- Step 4 -->
          <div class="bg-[#FAFBFC] border border-[#E3E6EB] rounded-2xl p-5 relative flex flex-col justify-between">
            <div>
              <div class="w-8 h-8 rounded-lg bg-[#EFF4FF] border border-[#C7D9FE] text-[#2554D6] flex items-center justify-center font-bold text-xs mb-3">
                4
              </div>
              <h3 class="text-sm font-semibold text-[#0F172A] mb-1">Suggest GL codes</h3>
              <p class="text-xs text-[#5B6577] leading-relaxed">
                Predictive distribution coding mapped with calibrated confidence scores.
              </p>
            </div>
            <div class="pt-4 mt-4 border-t border-[#E3E6EB] text-[#5B6577] flex items-center gap-1 text-[11px]">
              <span class="material-symbols-outlined text-[14px]">account_tree</span>
              <span>Confidence scoring</span>
            </div>
          </div>

          <!-- Step 5 -->
          <div class="bg-[#FAFBFC] border border-[#E3E6EB] rounded-2xl p-5 relative flex flex-col justify-between">
            <div>
              <div class="w-8 h-8 rounded-lg bg-[#EFF4FF] border border-[#C7D9FE] text-[#2554D6] flex items-center justify-center font-bold text-xs mb-3">
                5
              </div>
              <h3 class="text-sm font-semibold text-[#0F172A] mb-1">Human approve or reject</h3>
              <p class="text-xs text-[#5B6577] leading-relaxed">
                Specialist reviews flagged discrepancies, adds audit note, and commits.
              </p>
            </div>
            <div class="pt-4 mt-4 border-t border-[#E3E6EB] text-[#5B6577] flex items-center gap-1 text-[11px]">
              <span class="material-symbols-outlined text-[14px]">how_to_reg</span>
              <span>Reviewer sign-off</span>
            </div>
          </div>

        </div>

        <!-- Thin full-width append-only audit trail bar -->
        <div class="w-full bg-[#FAFBFC] border border-[#E3E6EB] rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-2 text-[#0F172A] font-medium">
            <span class="material-symbols-outlined text-[18px] text-[#2554D6]">verified_user</span>
            <span>Append-only audit trail: every action, override, and state change is cryptographically chained and tamper-evident.</span>
          </div>
          <div class="flex items-center gap-4 text-[#5B6577] shrink-0 font-mono text-[11px]">
            <span>SHA-256 HASH VERIFIED</span>
            <span class="text-[#E3E6EB]">|</span>
            <span>CHAIN LINK VERIFIED</span>
          </div>
        </div>

      </div>
    </section>

    <!-- 6) What the AI Does — and What the Reviewer Decides -->
    <section class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <div class="text-center max-w-2xl mx-auto mb-12">
        <span class="text-xs font-semibold text-[#2554D6] uppercase tracking-wider block mb-2">Governance &amp; Controls</span>
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0F172A] mb-3">
          What the AI does — and what the reviewer decides
        </h2>
        <p class="text-sm font-semibold text-[#2554D6]">
          AI proposes. A human decides.
        </p>
      </div>

      <!-- Two-Column Split Card -->
      <div class="grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden border border-[#E3E6EB] shadow-sm">
        
        <!-- Left: AI Tinted Panel -->
        <div class="bg-[#EFF4FF] p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-[#C7D9FE]">
          <div class="flex items-center gap-2 mb-6">
            <div class="w-8 h-8 rounded-lg bg-white text-[#2554D6] flex items-center justify-center border border-[#C7D9FE]">
              <span class="material-symbols-outlined text-[18px]">smart_toy</span>
            </div>
            <div>
              <span class="text-xs font-semibold uppercase tracking-wider text-[#1D4ED8] block">Autonomous Engine</span>
              <h3 class="text-lg font-bold text-[#0F172A]">Automated Extraction &amp; Verification</h3>
            </div>
          </div>

          <ul class="space-y-4 text-xs sm:text-sm text-[#0F172A]">
            <li class="flex items-start gap-3">
              <span class="material-symbols-outlined text-[#2554D6] text-[18px] shrink-0 mt-0.5">check_circle</span>
              <span>Extracts header fields and line items directly from uploaded PDF invoices.</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="material-symbols-outlined text-[#2554D6] text-[18px] shrink-0 mt-0.5">check_circle</span>
              <span>Matches each invoice to its open purchase order by PO number.</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="material-symbols-outlined text-[#2554D6] text-[18px] shrink-0 mt-0.5">check_circle</span>
              <span>Checks subtotal, tax and total arithmetic against the extracted values.</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="material-symbols-outlined text-[#2554D6] text-[18px] shrink-0 mt-0.5">check_circle</span>
              <span>Flags rule failures and PO limit ceiling overages prior to ledger staging.</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="material-symbols-outlined text-[#2554D6] text-[18px] shrink-0 mt-0.5">check_circle</span>
              <span>Proposes general ledger (GL) accounts with explicit confidence percentages based on historical vendor entries.</span>
            </li>
          </ul>
        </div>

        <!-- Right: Reviewer White Panel -->
        <div class="bg-white p-8 lg:p-10">
          <div class="flex items-center gap-2 mb-6">
            <div class="w-8 h-8 rounded-lg bg-[#F1F5F9] text-[#0F172A] flex items-center justify-center border border-[#CBD5E1]">
              <span class="material-symbols-outlined text-[18px]">person</span>
            </div>
            <div>
              <span class="text-xs font-semibold uppercase tracking-wider text-[#5B6577] block">Human Specialist</span>
              <h3 class="text-lg font-bold text-[#0F172A]">Reviewer Sign-off &amp; Adjudication</h3>
            </div>
          </div>

          <ul class="space-y-4 text-xs sm:text-sm text-[#0F172A]">
            <li class="flex items-start gap-3">
              <span class="material-symbols-outlined text-[#15803D] text-[18px] shrink-0 mt-0.5">done</span>
              <span>Resolves flagged exceptions, reviewing side-by-side original invoice PDFs with extracted values.</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="material-symbols-outlined text-[#15803D] text-[18px] shrink-0 mt-0.5">done</span>
              <span>Confirms or manually overrides low-confidence GL coding classifications with one click.</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="material-symbols-outlined text-[#15803D] text-[18px] shrink-0 mt-0.5">done</span>
              <span>Attaches reviewer notes to approvals and rejections for the audit trail.</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="material-symbols-outlined text-[#15803D] text-[18px] shrink-0 mt-0.5">done</span>
              <span>Authorizes final approval or triggers formal vendor rejection with detailed defect reporting.</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="material-symbols-outlined text-[#15803D] text-[18px] shrink-0 mt-0.5">done</span>
              <span>Confirms the GAAP and purchase-order review checklist before approval.</span>
            </li>
          </ul>
        </div>

      </div>
    </section>

    <!-- 7) Validation Rules -->
    <section id="validation" class="border-t border-[#E3E6EB] bg-white py-16 lg:py-24">
      <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div class="max-w-3xl mb-12">
          <span class="text-xs font-semibold text-[#2554D6] uppercase tracking-wider block mb-2">Deterministic Verification</span>
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0F172A] mb-4">
            Validation rules
          </h2>
          <p class="text-base text-[#5B6577]">
            Every ingested invoice is evaluated against standardized validation checks. Rules marked as blocking strictly halt autonomous processing until resolved by an AP reviewer.
          </p>
        </div>

        <!-- Ledger Styled Table -->
        <div class="bg-white rounded-2xl border border-[#E3E6EB] shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead class="bg-[#F1F5F9] text-[#5B6577] font-semibold border-b border-[#E3E6EB]">
                <tr>
                  <th scope="col" class="py-3 px-4 font-mono w-24">Rule ID</th>
                  <th scope="col" class="py-3 px-4">Check</th>
                  <th scope="col" class="py-3 px-4 w-32">Severity</th>
                  <th scope="col" class="py-3 px-4">What happens</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#E3E6EB]">
                
                                <!-- V001 -->
                <tr class="h-[44px] hover:bg-[#FAFBFC] transition-colors">
                  <td class="py-2.5 px-4 font-mono font-medium text-[#0F172A]">V001</td>
                  <td class="py-2.5 px-4 font-medium text-[#0F172A]">Line items sum matches subtotal</td>
                  <td class="py-2.5 px-4">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-[#FDECEC] text-[#B91C1C] border border-[#F87171]">
                      blocking
                    </span>
                  </td>
                  <td class="py-2.5 px-4 text-[#5B6577]">Flags arithmetic discrepancies between extracted line totals and the declared subtotal.</td>
                </tr>

                <!-- V002 -->
                <tr class="h-[44px] hover:bg-[#FAFBFC] transition-colors">
                  <td class="py-2.5 px-4 font-mono font-medium text-[#0F172A]">V002</td>
                  <td class="py-2.5 px-4 font-medium text-[#0F172A]">Subtotal + tax = total</td>
                  <td class="py-2.5 px-4">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-[#FDECEC] text-[#B91C1C] border border-[#F87171]">
                      blocking
                    </span>
                  </td>
                  <td class="py-2.5 px-4 text-[#5B6577]">Verifies header arithmetic consistency before committing amounts to payable journals.</td>
                </tr>

                <!-- V003 -->
                <tr class="h-[44px] hover:bg-[#FAFBFC] transition-colors">
                  <td class="py-2.5 px-4 font-mono font-medium text-[#0F172A]">V003</td>
                  <td class="py-2.5 px-4 font-medium text-[#0F172A]">Tax rate reasonable</td>
                  <td class="py-2.5 px-4">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-[#FFFBEB] text-[#B45309] border border-[#FCD34D]">
                      warning
                    </span>
                  </td>
                  <td class="py-2.5 px-4 text-[#5B6577]">Flags unusual effective tax rates for reviewer attention.</td>
                </tr>

                <!-- V004 -->
                <tr class="h-[44px] hover:bg-[#FAFBFC] transition-colors">
                  <td class="py-2.5 px-4 font-mono font-medium text-[#0F172A]">V004</td>
                  <td class="py-2.5 px-4 font-medium text-[#0F172A]">No duplicate invoice</td>
                  <td class="py-2.5 px-4">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-[#FDECEC] text-[#B91C1C] border border-[#F87171]">
                      blocking
                    </span>
                  </td>
                  <td class="py-2.5 px-4 text-[#5B6577]">Blocks a second submission of the same vendor invoice number.</td>
                </tr>

                <!-- V005 -->
                <tr class="h-[44px] hover:bg-[#FAFBFC] transition-colors">
                  <td class="py-2.5 px-4 font-mono font-medium text-[#0F172A]">V005</td>
                  <td class="py-2.5 px-4 font-medium text-[#0F172A]">PO number present</td>
                  <td class="py-2.5 px-4">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-[#FDECEC] text-[#B91C1C] border border-[#F87171]">
                      blocking
                    </span>
                  </td>
                  <td class="py-2.5 px-4 text-[#5B6577]">Halts non-PO invoices for discretionary authorization review before payment.</td>
                </tr>

                <!-- V006 -->
                <tr class="h-[44px] hover:bg-[#FAFBFC] transition-colors">
                  <td class="py-2.5 px-4 font-mono font-medium text-[#0F172A]">V006</td>
                  <td class="py-2.5 px-4 font-medium text-[#0F172A]">Total within PO tolerance</td>
                  <td class="py-2.5 px-4">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-[#FDECEC] text-[#B91C1C] border border-[#F87171]">
                      blocking
                    </span>
                  </td>
                  <td class="py-2.5 px-4 text-[#5B6577]">Blocks invoices that exceed the open purchase-order ceiling beyond tolerance.</td>
                </tr>

                <!-- V007 -->
                <tr class="h-[44px] hover:bg-[#FAFBFC] transition-colors">
                  <td class="py-2.5 px-4 font-mono font-medium text-[#0F172A]">V007</td>
                  <td class="py-2.5 px-4 font-medium text-[#0F172A]">Vendor matches PO vendor</td>
                  <td class="py-2.5 px-4">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-[#FDECEC] text-[#B91C1C] border border-[#F87171]">
                      blocking
                    </span>
                  </td>
                  <td class="py-2.5 px-4 text-[#5B6577]">Flags a vendor mismatch between the invoice and its purchase order.</td>
                </tr>

                <!-- V008 -->
                <tr class="h-[44px] hover:bg-[#FAFBFC] transition-colors">
                  <td class="py-2.5 px-4 font-mono font-medium text-[#0F172A]">V008</td>
                  <td class="py-2.5 px-4 font-medium text-[#0F172A]">Due date not before invoice date</td>
                  <td class="py-2.5 px-4">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-[#FDECEC] text-[#B91C1C] border border-[#F87171]">
                      blocking
                    </span>
                  </td>
                  <td class="py-2.5 px-4 text-[#5B6577]">Rejects impossible payment terms before ledger staging.</td>
                </tr>

                <!-- V009 -->
                <tr class="h-[44px] hover:bg-[#FAFBFC] transition-colors">
                  <td class="py-2.5 px-4 font-mono font-medium text-[#0F172A]">V009</td>
                  <td class="py-2.5 px-4 font-medium text-[#0F172A]">Quantity × price = amount</td>
                  <td class="py-2.5 px-4">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-[#FFFBEB] text-[#B45309] border border-[#FCD34D]">
                      warning
                    </span>
                  </td>
                  <td class="py-2.5 px-4 text-[#5B6577]">Flags line-level arithmetic that does not reconcile.</td>
                </tr>

</tbody>
            </table>
          </div>
        </div>

      </div>
    </section>

    <!-- 8) Outcomes Section -->
    <section class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <div class="max-w-3xl mb-12">
        <span class="text-xs font-semibold text-[#2554D6] uppercase tracking-wider block mb-2">Impact &amp; Efficiency</span>
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0F172A] mb-4">
          What changes operationally
        </h2>
        <p class="text-base text-[#5B6577]">
          Implementing deterministic verification shifts accounts payable from passive manual data entry to active risk control.
        </p>
      </div>

      <!-- 3 Outcome Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        
        <div class="bg-white p-6 rounded-2xl border border-[#E3E6EB] shadow-sm flex flex-col justify-between">
          <div>
            <div class="text-3xl font-bold tracking-tight text-[#0F172A] tabular-nums mb-1">&lt; 3 mins</div>
            <h3 class="text-base font-semibold text-[#0F172A] mb-2">Fewer manual touches</h3>
            <p class="text-xs sm:text-sm text-[#5B6577] leading-relaxed">
              Standard invoices with high PO match and valid GL distributions move straight through to batch approval in seconds rather than days.
            </p>
          </div>
          <div class="pt-4 mt-6 border-t border-[#E3E6EB] text-xs text-[#2554D6] font-medium flex items-center gap-1">
            <span class="material-symbols-outlined text-[16px]">touch_app</span>
            <span>Touchless queue throughput</span>
          </div>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-[#E3E6EB] shadow-sm flex flex-col justify-between">
          <div>
            <div class="text-3xl font-bold tracking-tight text-[#0F172A] tabular-nums mb-1">Pre-commit</div>
            <h3 class="text-base font-semibold text-[#0F172A] mb-2">Exceptions surfaced before payment</h3>
            <p class="text-xs sm:text-sm text-[#5B6577] leading-relaxed">
              Discrepancies in taxes, rates, and quantities are captured at ingestion, terminating erroneous disbursements before checks or wires leave treasury.
            </p>
          </div>
          <div class="pt-4 mt-6 border-t border-[#E3E6EB] text-xs text-[#2554D6] font-medium flex items-center gap-1">
            <span class="material-symbols-outlined text-[16px]">warning_amber</span>
            <span>Pre-disbursement gating</span>
          </div>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-[#E3E6EB] shadow-sm flex flex-col justify-between">
          <div>
            <div class="text-3xl font-bold tracking-tight text-[#0F172A] tabular-nums mb-1">100% Chain</div>
            <h3 class="text-base font-semibold text-[#0F172A] mb-2">Audit-ready evidence</h3>
            <p class="text-xs sm:text-sm text-[#5B6577] leading-relaxed">
              Every reviewer note, override justification, and OCR extraction confidence rating is packaged into an exportable immutable audit record.
            </p>
          </div>
          <div class="pt-4 mt-6 border-t border-[#E3E6EB] text-xs text-[#2554D6] font-medium flex items-center gap-1">
            <span class="material-symbols-outlined text-[16px]">security</span>
            <span>Tamper-evident audit chain</span>
          </div>
        </div>

      </div>

      <!-- Generic Blockquote Callout -->
      <div class="bg-white rounded-2xl border border-[#E3E6EB] p-8 shadow-sm relative">
        <div class="flex items-start gap-4">
          <span class="material-symbols-outlined text-[#2554D6] text-3xl shrink-0">format_quote</span>
          <div>
            <p class="text-base sm:text-lg text-[#0F172A] italic leading-relaxed mb-4">
              "Before LedgerLens, our controllers spent the first four days of every month end hunting down who authorized off-contract cloud billing overages. Having automated PO ceiling enforcement and immutable justification logs converted audit preparation from a multi-day fire drill into a 30-second CSV export."
            </p>
            <div class="text-xs font-semibold text-[#5B6577] tracking-wider uppercase">
              AP Leadership, Multi-Entity Pilot
            </div>
          </div>
        </div>
      </div>

    </section>

    <!-- 9) Roadmap: Where this goes next -->
    <section id="roadmap" class="border-t border-[#E3E6EB] bg-white py-16 lg:py-24">
      <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div class="max-w-3xl mb-12">
          <span class="text-xs font-semibold text-[#2554D6] uppercase tracking-wider block mb-2">Engineering Trajectory</span>
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0F172A] mb-4">
            Where this goes next
          </h2>
          <p class="text-base text-[#5B6577]">
            LedgerLens is designed for evolutionary integration into high-assurance enterprise ERP architectures.
          </p>
        </div>

        <!-- Three Columns: Now / Next / Later -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <!-- Column 1: Now -->
          <div class="bg-[#FAFBFC] border border-[#E3E6EB] rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-2 mb-4">
                <div class="w-8 h-8 rounded-lg bg-[#EFF4FF] border border-[#C7D9FE] text-[#2554D6] flex items-center justify-center">
                  <span class="material-symbols-outlined text-[18px]">verified</span>
                </div>
                <div>
                  <span class="text-xs font-semibold uppercase tracking-wider text-[#2554D6] block">Current Release</span>
                  <h3 class="text-lg font-bold text-[#0F172A]">Now</h3>
                </div>
              </div>

              <ul class="space-y-3 text-xs sm:text-sm text-[#5B6577]">
                <li class="flex items-start gap-2.5">
                  <span class="material-symbols-outlined text-[#2554D6] text-[16px] mt-0.5 shrink-0">check</span>
                  <span>Human-in-the-loop review workspace</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <span class="material-symbols-outlined text-[#2554D6] text-[16px] mt-0.5 shrink-0">check</span>
                  <span>Cryptographic immutable audit chain</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <span class="material-symbols-outlined text-[#2554D6] text-[16px] mt-0.5 shrink-0">check</span>
                  <span>CSV export for approved AP batches</span>
                </li>
              </ul>
            </div>
            <div class="pt-4 mt-6 border-t border-[#E3E6EB] text-xs font-mono text-[#5B6577]">
              v4.12 Demo Build
            </div>
          </div>

          <!-- Column 2: Next -->
          <div class="bg-[#FAFBFC] border border-[#E3E6EB] rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-2 mb-4">
                <div class="w-8 h-8 rounded-lg bg-[#EFF4FF] border border-[#C7D9FE] text-[#2554D6] flex items-center justify-center">
                  <span class="material-symbols-outlined text-[18px]">update</span>
                </div>
                <div>
                  <span class="text-xs font-semibold uppercase tracking-wider text-[#2554D6] block">In Development</span>
                  <h3 class="text-lg font-bold text-[#0F172A]">Next</h3>
                </div>
              </div>

              <ul class="space-y-3 text-xs sm:text-sm text-[#5B6577]">
                <li class="flex items-start gap-2.5">
                  <span class="material-symbols-outlined text-[#2554D6] text-[16px] mt-0.5 shrink-0">arrow_right_alt</span>
                  <span>ERP write-back (NetSuite / SAP S/4HANA)</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <span class="material-symbols-outlined text-[#2554D6] text-[16px] mt-0.5 shrink-0">arrow_right_alt</span>
                  <span>Cross-batch duplicate hash detection</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <span class="material-symbols-outlined text-[#2554D6] text-[16px] mt-0.5 shrink-0">arrow_right_alt</span>
                  <span>SAML SSO and role-based approval tiers</span>
                </li>
              </ul>
            </div>
            <div class="pt-4 mt-6 border-t border-[#E3E6EB] text-xs font-mono text-[#5B6577]">
              Q3 2025 Planned Rollout
            </div>
          </div>

          <!-- Column 3: Later -->
          <div class="bg-[#FAFBFC] border border-[#E3E6EB] rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-2 mb-4">
                <div class="w-8 h-8 rounded-lg bg-[#EFF4FF] border border-[#C7D9FE] text-[#2554D6] flex items-center justify-center">
                  <span class="material-symbols-outlined text-[18px]">schedule</span>
                </div>
                <div>
                  <span class="text-xs font-semibold uppercase tracking-wider text-[#5B6577] block">Vision &amp; Scale</span>
                  <h3 class="text-lg font-bold text-[#0F172A]">Later</h3>
                </div>
              </div>

              <ul class="space-y-3 text-xs sm:text-sm text-[#5B6577]">
                <li class="flex items-start gap-2.5">
                  <span class="material-symbols-outlined text-[#5B6577] text-[16px] mt-0.5 shrink-0">more_horiz</span>
                  <span>Multi-entity international tax rules</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <span class="material-symbols-outlined text-[#5B6577] text-[16px] mt-0.5 shrink-0">more_horiz</span>
                  <span>SLA-based queue routing and escalations</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <span class="material-symbols-outlined text-[#5B6577] text-[16px] mt-0.5 shrink-0">more_horiz</span>
                  <span>Vendor-facing self-service dispute portal</span>
                </li>
                <li class="flex items-start gap-2.5">
                  <span class="material-symbols-outlined text-[#5B6577] text-[16px] mt-0.5 shrink-0">more_horiz</span>
                  <span>Payment-run batching with treasury sync</span>
                </li>
              </ul>
            </div>
            <div class="pt-4 mt-6 border-t border-[#E3E6EB] text-xs font-mono text-[#5B6577]">
              Enterprise Horizon
            </div>
          </div>

        </div>

      </div>
    </section>

    <!-- 10) Demo CTA Band -->
    <section class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
      <div class="bg-[#EFF4FF] rounded-2xl border border-[#C7D9FE] p-8 md:p-12 lg:p-16 text-center max-w-4xl mx-auto shadow-sm">
        
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-[#C7D9FE] text-[#1D4ED8] text-xs font-semibold uppercase tracking-wider mb-4">
          <span class="material-symbols-outlined text-[16px]">science</span>
          <span>Test The Verification Engine</span>
        </span>

        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0F172A] mb-4">
          Try it with invoices that are designed to fail
        </h2>

        <p class="text-sm sm:text-base text-[#5B6577] max-w-xl mx-auto mb-8">
          The ZIP contains 10 invoices with intentional PO, tax, GL and duplicate errors. Test how the engine flags every issue and isolates exceptions for reviewer sign-off.
        </p>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <a href="/downloads/ledgerlens-sample-invoices.zip" download class="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-white bg-[#2554D6] hover:bg-[#1B43B3] rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors">
            <span class="material-symbols-outlined text-[18px]">folder_zip</span>
            <span>Download sample invoices (ZIP)</span>
          </a>
          <a href="/login" class="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-[#0F172A] bg-white hover:bg-[#F1F5F9] rounded-lg border border-[#E3E6EB] shadow-sm flex items-center justify-center gap-2 transition-colors">
            <span>Open the demo</span>
            <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
          </a>
        </div>

        <!-- Credential line -->
        <div class="inline-flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 bg-white border border-[#C7D9FE] rounded-lg px-4 py-2.5 text-xs text-[#5B6577]">
          <div class="flex items-center gap-2">
            <span class="font-medium text-[#0F172A]">Demo Reviewer:</span>
            <code class="font-mono bg-[#FAFBFC] px-2 py-0.5 rounded border border-[#E3E6EB] text-[#0F172A]">{demoEmail}</code>
            <button type="button" class="text-[#5B6577] hover:text-[#0F172A]" title="Copy Email" aria-label="Copy Email" onclick={copyEmail}>
              <span class="material-symbols-outlined text-[16px]">{copied ? 'check' : 'content_copy'}</span>
            </button>
          </div>
          <span class="hidden sm:inline text-[#CBD5E1]">|</span>
          <span>No password required — one-click sign-in</span>
        </div>

      </div>
    </section>

  </main>

  <!-- 11) Footer -->
  <footer class="border-t border-[#E3E6EB] bg-white py-8">
    <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5B6577]">
      <div>
        © 2025 LedgerLens Inc. Accounts Payable &amp; Ledger Automation.
      </div>
      <div class="flex items-center gap-4">
        <span class="inline-flex items-center gap-1.5 font-medium text-[#0F172A]">
          <span class="material-symbols-outlined text-[16px] text-emerald-600">verified_user</span>
          <span>Audit-ready evidence</span>
        </span>
        <span class="text-[#E3E6EB]">|</span>
        <span class="font-mono text-[11px] text-[#5B6577]">
          Audit Trail v4.12
        </span>
      </div>
    </div>
  </footer>
</div>

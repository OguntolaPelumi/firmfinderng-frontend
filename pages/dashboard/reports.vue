<template>
  <NuxtLayout name="dashboard" title="Market Reports" subtitle="Nigerian market intelligence and industry analysis">
    <div class="reports">

      <!-- Upgrade banner -->
      <div v-if="needsUpgrade" class="upgrade-banner">
        <Icon name="ph:info-fill" style="flex-shrink:0;font-size:1.1rem" />
        <span class="upgrade-text">Full reports with insights require the <strong>Pro or Enterprise</strong> plan.</span>
        <NuxtLink to="/dashboard/billing" class="upgrade-action">Upgrade now <Icon name="ph:arrow-right" /></NuxtLink>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="reports-grid" aria-busy="true" aria-live="polite">
        <span class="sr-only">Loading reports...</span>
        <div v-for="n in 3" :key="n" class="sk sk-card" />
      </div>

      <!-- Error -->
      <div v-else-if="loadError" class="state-card" role="alert">
        <div class="state-icon state-icon-error"><Icon name="ph:warning-circle-fill" style="font-size:1.5rem" /></div>
        <p class="state-title">We couldn't load the reports</p>
        <p class="state-sub">Check your connection and try again.</p>
        <button type="button" class="r-btn r-btn-primary" @click="loadReports">
          <Icon name="ph:arrow-clockwise" /> Try again
        </button>
      </div>

      <!-- Empty -->
      <div v-else-if="!reports.length" class="state-card">
        <div class="state-icon"><Icon name="ph:chart-bar-fill" style="font-size:1.5rem" /></div>
        <p class="state-title">No reports available yet</p>
        <p class="state-sub">New market reports are published regularly. Check back soon.</p>
      </div>

      <template v-else>

        <!-- Industry filter chips -->
        <div v-if="industries.length > 1" class="chips" role="group" aria-label="Filter by industry">
          <button type="button" class="chip" :class="{ 'chip-active': !activeIndustry }" :aria-pressed="!activeIndustry" @click="activeIndustry = ''">
            All <span class="chip-count">{{ reports.length }}</span>
          </button>
          <button
            v-for="ind in industries"
            :key="ind"
            type="button"
            class="chip"
            :class="{ 'chip-active': activeIndustry === ind }"
            :aria-pressed="activeIndustry === ind"
            @click="activeIndustry = ind"
          >
            {{ ind }}
          </button>
        </div>

        <div class="reports-grid">
          <article v-for="report in filteredReports" :key="report.id" class="report-card">
            <div class="report-card-header">
              <span class="report-industry">{{ report.industry }}</span>
              <span v-if="report.published_at" class="report-date">{{ formatDate(report.published_at) }}</span>
            </div>

            <h3 class="report-title">{{ report.title }}</h3>
            <p class="report-summary">{{ report.summary }}</p>

            <div v-if="report.key_insights?.length" class="report-insights">
              <p class="insights-heading">Key insights</p>
              <ul class="insights-list">
                <li v-for="(insight, i) in visibleInsights(report)" :key="i">
                  <Icon name="ph:arrow-right-bold" class="insight-arrow" />
                  <span>{{ insight }}</span>
                </li>
              </ul>
              <button
                v-if="report.key_insights.length > 3"
                type="button"
                class="link-btn"
                :aria-expanded="expanded.has(report.id)"
                @click="toggleExpanded(report.id)"
              >
                {{ expanded.has(report.id) ? 'Show fewer' : `Show all ${report.key_insights.length} insights` }}
              </button>
            </div>

            <div v-else class="report-locked">
              <div class="locked-icon"><Icon name="ph:lock-simple-fill" /></div>
              <div class="locked-text">
                <p class="locked-title">Full report locked</p>
                <p class="locked-sub">{{ freeAccess ? 'Insights for this report are coming soon.' : 'Available on Pro and Enterprise plans.' }}</p>
              </div>
              <NuxtLink v-if="!freeAccess" to="/dashboard/billing" class="r-btn r-btn-outline r-btn-sm">Upgrade</NuxtLink>
            </div>
          </article>
        </div>

        <p v-if="!filteredReports.length" class="no-match">No reports match this industry.</p>
      </template>

    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { api, freeAccess, hasPremiumReports } = useAuth()
const loading = ref(true)
const loadError = ref(false)
const reports = ref<any[]>([])
const activeIndustry = ref('')
const expanded = ref<Set<any>>(new Set())

const needsUpgrade = computed(() => !freeAccess && !hasPremiumReports.value)

const industries = computed(() => [...new Set(reports.value.map(r => r.industry).filter(Boolean))])
const filteredReports = computed(() =>
  activeIndustry.value ? reports.value.filter(r => r.industry === activeIndustry.value) : reports.value
)

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })

const visibleInsights = (report: any) =>
  expanded.value.has(report.id) ? report.key_insights : report.key_insights.slice(0, 3)

const toggleExpanded = (id: any) => {
  const next = new Set(expanded.value)
  next.has(id) ? next.delete(id) : next.add(id)
  expanded.value = next
}

const loadReports = async () => {
  loading.value = true
  loadError.value = false
  try { const data: any = await api('/reports/'); reports.value = data.results || data }
  catch { loadError.value = true }
  finally { loading.value = false }
}
onMounted(loadReports)
</script>

<style scoped>
.reports {
  /* Nigerian flag green theme */
  --primary: #008751;
  --primary-dark: #006b41;
  --primary-light: #e8f5ee;
  --primary-border: #b7dfc9;
  font-family: var(--font);
  min-width: 0;
}

.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

/* Buttons */
.r-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; height: 44px; padding: 0 1.1rem; font: inherit; font-size: 0.9rem; font-weight: 600; border-radius: var(--radius-md); border: 1px solid transparent; cursor: pointer; text-decoration: none; white-space: nowrap; transition: background 0.15s; }
.r-btn-primary { background: var(--primary); color: white; }
.r-btn-primary:hover { background: var(--primary-dark); }
.r-btn-outline { background: var(--cream); color: var(--primary); border-color: var(--primary); }
.r-btn-outline:hover { background: var(--primary-light); }
.r-btn-sm { height: 36px; padding: 0 0.9rem; font-size: 0.82rem; }
.r-btn:focus-visible { outline: 2px solid var(--primary-dark); outline-offset: 2px; }

/* Upgrade banner */
.upgrade-banner { display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1rem; margin-bottom: 1.25rem; background: var(--primary-light); border: 1px solid var(--primary-border); border-radius: var(--radius-md); color: var(--primary-dark); font-size: 0.875rem; }
.upgrade-text { flex: 1; }
.upgrade-action { display: inline-flex; align-items: center; gap: 0.3rem; font-weight: 700; color: var(--primary-dark); text-decoration: underline; white-space: nowrap; }

/* Industry chips */
.chips { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.25rem; }
.chip { display: inline-flex; align-items: center; gap: 0.4rem; height: 36px; padding: 0 0.95rem; font: inherit; font-size: 0.82rem; font-weight: 600; text-transform: capitalize; color: var(--gray-700); background: var(--cream); border: 1px solid var(--border); border-radius: 999px; cursor: pointer; transition: background 0.15s, border-color 0.15s, color 0.15s; }
.chip:hover { border-color: var(--primary-border); background: var(--primary-light); }
.chip-active, .chip-active:hover { background: var(--primary); border-color: var(--primary); color: white; }
.chip-count { font-size: 0.72rem; font-weight: 700; padding: 1px 7px; border-radius: 999px; background: rgba(255,255,255,0.25); }
.chip:focus-visible { outline: 2px solid var(--primary-dark); outline-offset: 2px; }

/* Grid + cards */
.reports-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr)); gap: 1.25rem; }
.report-card { background: var(--cream); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem; box-shadow: var(--shadow-sm); transition: box-shadow 0.15s, border-color 0.15s; display: flex; flex-direction: column; min-width: 0; }
.report-card:hover { box-shadow: var(--shadow-md); border-color: var(--primary-border); }
.report-card-header { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; margin-bottom: 0.875rem; }
.report-industry { background: var(--primary-light); color: var(--primary-dark); padding: 3px 11px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; text-transform: capitalize; }
.report-date { font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; }
.report-title { font-size: 1.05rem; font-weight: 700; color: var(--gray-900); margin-bottom: 0.625rem; line-height: 1.4; overflow-wrap: anywhere; }
.report-summary { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1.25rem; flex: 1; }

/* Insights */
.report-insights { background: var(--sand); border: 1px solid var(--primary-border); border-radius: var(--radius-md); padding: 1rem; }
.insights-heading { font-size: 0.8rem; font-weight: 700; color: var(--primary-dark); margin-bottom: 0.625rem; }
.insights-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.55rem; }
.insights-list li { display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.85rem; line-height: 1.5; color: var(--gray-700); }
.insight-arrow { color: var(--primary); font-size: 0.75rem; flex-shrink: 0; margin-top: 5px; }
.link-btn { margin-top: 0.75rem; padding: 0.35rem 0; background: none; border: 0; font: inherit; font-size: 0.8rem; font-weight: 700; color: var(--primary); cursor: pointer; }
.link-btn:hover { text-decoration: underline; }

/* Locked state */
.report-locked { display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem; border: 1px dashed var(--primary-border); border-radius: var(--radius-md); background: var(--cream); }
.locked-icon { width: 36px; height: 36px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.locked-text { flex: 1; min-width: 0; }
.locked-title { font-size: 0.85rem; font-weight: 700; color: var(--gray-900); }
.locked-sub { font-size: 0.78rem; color: var(--text-muted); }

/* States */
.state-card { background: var(--cream); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 3.5rem 1.5rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.4rem; box-shadow: var(--shadow-sm); }
.state-icon { width: 56px; height: 56px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem; }
.state-icon-error { background: #fdf2f2; color: #b91c1c; }
.state-title { font-weight: 700; color: var(--gray-900); }
.state-sub { font-size: 0.875rem; color: var(--text-muted); max-width: 340px; margin-bottom: 0.75rem; }
.no-match { text-align: center; color: var(--text-muted); font-size: 0.9rem; padding: 2rem 0; }

/* Skeleton */
.sk { background: linear-gradient(90deg, #F3EBC0 25%, var(--cream) 50%, #F3EBC0 75%); background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite; border-radius: var(--radius-lg); }
@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
.sk-card { height: 300px; }

/* ---------- Responsive ---------- */
@media (max-width: 640px) {
  .upgrade-banner { flex-wrap: wrap; }
  .upgrade-text { flex-basis: calc(100% - 2rem); }
  .upgrade-action { margin-left: 1.85rem; }

  /* Chips scroll sideways instead of wrapping into many rows */
  .chips { flex-wrap: nowrap; overflow-x: auto; margin-left: -0.25rem; margin-right: -0.25rem; padding: 0 0.25rem 0.25rem; scrollbar-width: none; }
  .chips::-webkit-scrollbar { display: none; }
  .chip { flex-shrink: 0; }

  .reports-grid { gap: 1rem; }
  .report-card { padding: 1.25rem; }
  .report-locked { flex-wrap: wrap; }
  .report-locked .r-btn { width: 100%; }
}

@media (hover: none) {
  .report-card:hover { box-shadow: var(--shadow-sm); border-color: var(--border); }
}

@media (prefers-reduced-motion: reduce) {
  .sk { animation: none; }
}
</style>

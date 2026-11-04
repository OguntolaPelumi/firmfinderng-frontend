<template>
  <NuxtLayout name="dashboard" title="Overview" subtitle="Your FirmFinderNG dashboard">
    <div class="dash">

      <!-- Loading skeleton -->
      <div v-if="loading" class="skeleton-wrap" aria-busy="true" aria-live="polite">
        <span class="sr-only">Loading dashboard...</span>
        <div class="stats-grid">
          <div v-for="n in 4" :key="n" class="stat-card skeleton-card">
            <div class="sk sk-icon" />
            <div class="sk-lines">
              <div class="sk sk-line sk-line-sm" />
              <div class="sk sk-line sk-line-lg" />
            </div>
          </div>
        </div>
        <div class="dash-row">
          <div class="card sk sk-block" />
          <div class="card sk sk-block" />
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="loadError" class="card error-card" role="alert">
        <div class="error-icon">
          <Icon name="ph:warning-circle-fill" style="font-size:1.5rem" />
        </div>
        <div class="error-text">
          <p class="error-title">We couldn't load your dashboard</p>
          <p class="error-sub">Check your connection and try again.</p>
        </div>
        <button type="button" class="dash-btn dash-btn-primary" @click="loadStats">
          <Icon name="ph:arrow-clockwise" /> Try again
        </button>
      </div>

      <div v-else>

        <!-- Stats -->
        <div class="stats-grid">
          <div
            v-for="stat in statCards"
            :key="stat.label"
            class="stat-card"
            :class="{ 'stat-card-featured': stat.featured }"
          >
            <div class="stat-icon">
              <Icon :name="stat.icon" style="font-size:1.2rem" />
            </div>
            <div class="stat-body">
              <p class="stat-label">{{ stat.label }}</p>
              <p class="stat-value">{{ stat.value }}</p>
            </div>
          </div>
        </div>

        <!-- Plan + actions row -->
        <div class="dash-row">

          <!-- Plan card -->
          <section class="card plan-card" aria-labelledby="plan-heading">
            <div class="plan-top">
              <div>
                <p id="plan-heading" class="card-eyebrow">{{ freeAccess ? 'Your access' : 'Current plan' }}</p>
                <p class="plan-name">{{ freeAccess ? 'FREE ACCESS' : stats.plan?.toUpperCase() || 'FREE' }}</p>
              </div>
              <span class="plan-badge">{{ freeAccess ? 'launch' : stats.plan || 'free' }}</span>
            </div>

            <p v-if="unlimited" class="plan-free-note">
              Everything is unlocked while FirmFinderNG is in launch: full contact details, CSV export and every market report.
            </p>

            <div v-else class="plan-progress">
              <div class="plan-progress-labels">
                <span>Leads used this month</span>
                <span class="plan-progress-count">{{ stats.leads_used || 0 }} / {{ stats.leads_limit || 0 }}</span>
              </div>
              <div
                class="plan-progress-track"
                role="progressbar"
                :aria-valuenow="Math.round(usedPct)"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label="Leads used this month"
              >
                <div class="plan-progress-fill" :style="{ width: usedPct + '%', background: progressColor }" />
              </div>
              <p class="plan-progress-note" :class="`note-${usageLevel}`">{{ usageMessage }}</p>
            </div>

            <NuxtLink v-if="freeAccess" to="/dashboard/leads" class="dash-btn dash-btn-primary dash-btn-block">
              Find leads <Icon name="ph:arrow-right" />
            </NuxtLink>
            <NuxtLink v-else-if="stats.plan !== 'enterprise'" to="/dashboard/billing" class="dash-btn dash-btn-primary dash-btn-block">
              {{ paymentsEnabled ? 'Upgrade plan' : 'See plans' }} <Icon name="ph:arrow-right" />
            </NuxtLink>
          </section>

          <!-- Quick actions -->
          <section class="card actions-card" aria-labelledby="actions-heading">
            <p id="actions-heading" class="card-title">Quick actions</p>
            <div class="quick-grid">
              <NuxtLink v-for="action in quickActions" :key="action.label" :to="action.to" class="quick-item">
                <div class="quick-item-icon">
                  <Icon :name="action.icon" style="font-size:1.1rem" />
                </div>
                <div class="quick-item-text">
                  <p class="quick-item-label">{{ action.label }}</p>
                  <p class="quick-item-sub">{{ action.sub }}</p>
                </div>
                <Icon name="ph:caret-right" class="quick-item-arrow" />
              </NuxtLink>
            </div>
          </section>

        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { api, freeAccess, paymentsEnabled } = useAuth()
const loading = ref(true)
const loadError = ref(false)
const stats = ref<any>({})

const loadStats = async () => {
  loading.value = true
  loadError.value = false
  try { stats.value = await api('/businesses/stats/') }
  catch { loadError.value = true }
  finally { loading.value = false }
}
onMounted(loadStats)

// leads_limit / leads_remaining are null when the account has no monthly cap
const unlimited = computed(() => stats.value.leads_limit === null)

const statCards = computed(() => [
  unlimited.value
    ? { label: 'Leads available', value: 'Unlimited', icon: 'ph:check-circle-fill', featured: true }
    : { label: 'Leads remaining', value: stats.value.leads_remaining?.toLocaleString() || '0', icon: 'ph:check-circle-fill', featured: true },
  unlimited.value
    ? { label: 'Leads used this month', value: (stats.value.leads_used || 0).toLocaleString(), icon: 'ph:database-fill', featured: false }
    : { label: 'Leads used', value: `${stats.value.leads_used || 0} / ${stats.value.leads_limit || 0}`, icon: 'ph:database-fill', featured: false },
  { label: 'Total businesses', value: stats.value.total_businesses?.toLocaleString() || '0', icon: 'ph:buildings-fill', featured: false },
  { label: 'Total exports', value: stats.value.total_exports?.toLocaleString?.() || '0', icon: 'ph:export-fill', featured: false },
])

// Usage
const usedPct = computed(() => {
  const limit = stats.value.leads_limit || 0
  if (!limit) return 0
  return Math.min(((stats.value.leads_used || 0) / limit) * 100, 100)
})
const usageLevel = computed(() => usedPct.value >= 90 ? 'high' : usedPct.value >= 70 ? 'mid' : 'ok')
const progressColor = computed(() =>
  usageLevel.value === 'high' ? '#dc2626' : usageLevel.value === 'mid' ? '#d97706' : 'var(--primary)'
)
const usageMessage = computed(() => {
  const left = (stats.value.leads_remaining ?? 0).toLocaleString()
  if (usageLevel.value === 'high') return `Almost out: only ${left} leads left this month.`
  if (usageLevel.value === 'mid') return `You've used ${Math.round(usedPct.value)}% of your leads. ${left} left.`
  return `${left} leads left this month.`
})

// Accounts without export get pointed to upgrade instead of a dead end
const quickActions = computed(() => {
  const canExport = stats.value.can_export ?? true
  return [
    { to: '/dashboard/leads', label: 'Search leads', sub: 'Find businesses by industry', icon: 'ph:magnifying-glass-fill' },
    canExport
      ? { to: '/dashboard/leads', label: 'Export CSV', sub: 'Download filtered leads', icon: 'ph:export-fill' }
      : { to: '/dashboard/billing', label: 'Export CSV', sub: 'Upgrade to unlock exports', icon: 'ph:lock-simple-fill' },
    { to: '/dashboard/reports', label: 'Market reports', sub: 'Latest Nigerian insights', icon: 'ph:chart-bar-fill' },
    freeAccess
      ? { to: '/dashboard/profile', label: 'My profile', sub: 'Update your details', icon: 'ph:user-circle-fill' }
      : { to: '/dashboard/billing', label: 'Plan & payments', sub: 'View plan and payment history', icon: 'ph:receipt-fill' },
  ]
})
</script>

<style scoped>
.dash {
  /* Nigerian flag green theme */
  --primary: #008751;
  --primary-dark: #006b41;
  --primary-light: #e8f5ee;
  --primary-border: #b7dfc9;
  font-family: var(--font);
  min-width: 0;
}

.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

/* Shared card */
.card { background: var(--cream); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem; box-shadow: var(--shadow-sm); }
.card-eyebrow { font-size: 0.75rem; color: var(--text-muted); font-weight: 500; margin-bottom: 0.25rem; }
.card-title { font-size: 0.95rem; font-weight: 700; color: var(--gray-900); margin-bottom: 1rem; }

/* Buttons */
.dash-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; height: 44px; padding: 0 1.1rem; font: inherit; font-size: 0.9rem; font-weight: 600; text-decoration: none; border: 0; border-radius: var(--radius-md); cursor: pointer; transition: background 0.15s; }
.dash-btn-primary { background: var(--primary); color: white; }
.dash-btn-primary:hover { background: var(--primary-dark); }
.dash-btn:focus-visible { outline: 2px solid var(--primary-dark); outline-offset: 2px; }
.dash-btn-block { width: 100%; }

/* Stats */
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.25rem; }
.stat-card { background: var(--cream); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.25rem; display: flex; align-items: center; gap: 1rem; box-shadow: var(--shadow-sm); min-width: 0; transition: border-color 0.15s, box-shadow 0.15s; }
.stat-card:hover { box-shadow: var(--shadow-md); border-color: var(--primary-border); }
.stat-icon { width: 46px; height: 46px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: var(--primary-light); color: var(--primary); }
.stat-body { min-width: 0; }
.stat-label { font-size: 0.78rem; color: var(--text-muted); font-weight: 500; margin-bottom: 0.2rem; }
.stat-value { font-size: 1.5rem; font-weight: 800; color: var(--gray-900); letter-spacing: -0.01em; line-height: 1.15; overflow-wrap: anywhere; }

/* The one emphasized card: leads remaining */
.stat-card-featured { background: linear-gradient(90deg, #9acca8 0%, #acd5b6 50%, #9acca8 100%); border-color: #9acca8; }
.stat-card-featured:hover { border-color: var(--primary-dark); }
.stat-card-featured .stat-icon { background: rgba(255, 253, 243, 0.55); color: var(--primary); }
.stat-card-featured .stat-label { color: var(--text-secondary); }
.stat-card-featured .stat-value { color: var(--text-accent); }
/* Brand green glows at both edges with a warm amber glow between them, same as the landing CTA */
.stat-card-featured { position: relative; isolation: isolate; overflow: hidden; }
.stat-card-featured::before {
  content: ''; position: absolute; inset: -15% -10%; z-index: -1; pointer-events: none;
  background:
    radial-gradient(45% 90% at 8% 40%, rgba(0, 135, 81, 0.5), transparent 75%),
    radial-gradient(45% 90% at 92% 60%, rgba(0, 135, 81, 0.5), transparent 75%),
    radial-gradient(26% 50% at 50% 70%, rgba(255, 170, 90, 0.22), transparent 72%);
  filter: blur(24px);
  animation: warm-drift 14s ease-in-out infinite alternate;
}
@keyframes warm-drift {
  0%   { transform: translate3d(-4%, 0, 0) scale(1); }
  50%  { transform: translate3d(3%, 4%, 0) scale(1.08); }
  100% { transform: translate3d(5%, -2%, 0) scale(1.02); }
}
@media (prefers-reduced-motion: reduce) { .stat-card-featured::before { animation: none; } }

/* Plan + actions */
.plan-free-note { font-size: 0.875rem; line-height: 1.55; color: var(--text-secondary); margin-bottom: 1.25rem; }
.dash-row { display: grid; grid-template-columns: 320px 1fr; gap: 1.25rem; align-items: start; }

.plan-card { display: flex; flex-direction: column; gap: 1.5rem; }
.plan-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; }
.plan-name { font-size: 1.4rem; font-weight: 800; color: var(--gray-900); letter-spacing: 0.01em; }
.plan-badge { padding: 0.25rem 0.75rem; font-size: 0.75rem; font-weight: 700; text-transform: capitalize; color: var(--primary); background: var(--primary-light); border: 1px solid var(--primary-border); border-radius: 999px; }

.plan-progress-labels { display: flex; justify-content: space-between; gap: 0.5rem; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem; }
.plan-progress-count { font-weight: 600; color: var(--gray-700); white-space: nowrap; }
.plan-progress-track { background: var(--primary-light); border-radius: 999px; height: 8px; overflow: hidden; }
.plan-progress-fill { height: 100%; border-radius: 999px; transition: width 0.5s ease; }
.plan-progress-note { margin-top: 0.625rem; font-size: 0.8rem; color: var(--text-muted); }
.note-mid { color: #b45309; }
.note-high { color: #b91c1c; font-weight: 600; }

/* Quick actions */
.quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.quick-item { display: flex; align-items: center; gap: 0.875rem; padding: 1rem; min-height: 68px; border: 1px solid var(--border); border-radius: var(--radius-md); text-decoration: none; background: var(--cream); transition: border-color 0.15s, background 0.15s; }
.quick-item:hover { border-color: var(--primary-border); background: var(--primary-light); }
.quick-item:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.quick-item-icon { width: 40px; height: 40px; border-radius: var(--radius); display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: var(--primary-light); color: var(--primary); }
.quick-item:hover .quick-item-icon { background: var(--cream); }
.quick-item-text { flex: 1; min-width: 0; }
.quick-item-label { font-size: 0.875rem; font-weight: 600; color: var(--gray-800); }
.quick-item-sub { font-size: 0.78rem; color: var(--text-muted); line-height: 1.35; }
.quick-item-arrow { flex-shrink: 0; color: var(--gray-500); transition: transform 0.15s, color 0.15s; }
.quick-item:hover .quick-item-arrow { color: var(--primary); transform: translateX(2px); }

/* Error */
.error-card { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
.error-icon { width: 48px; height: 48px; border-radius: var(--radius-md); background: #fdf2f2; color: #b91c1c; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.error-text { flex: 1; min-width: 200px; }
.error-title { font-weight: 700; color: var(--gray-900); }
.error-sub { font-size: 0.85rem; color: var(--text-muted); }

/* Skeleton */
.sk { background: linear-gradient(90deg, #F3EBC0 25%, var(--cream) 50%, #F3EBC0 75%); background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite; border-radius: var(--radius-md); }
@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
.skeleton-card { min-height: 88px; }
.sk-icon { width: 46px; height: 46px; flex-shrink: 0; }
.sk-lines { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
.sk-line { height: 12px; }
.sk-line-sm { width: 55%; }
.sk-line-lg { height: 20px; width: 80%; }
.sk-block { height: 220px; border: 1px solid var(--border); }

/* ---------- Responsive ---------- */
@media (max-width: 1200px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 900px) {
  .dash-row { grid-template-columns: 1fr; }
}

@media (max-width: 600px) {
  .card { padding: 1.25rem; }
  .stats-grid { gap: 0.75rem; margin-bottom: 1rem; }
  .stat-card { padding: 1rem; gap: 0.75rem; }
  .stat-icon { width: 40px; height: 40px; }
  .stat-value { font-size: 1.25rem; }
  .quick-grid { grid-template-columns: 1fr; }
}

@media (max-width: 400px) {
  .stats-grid { grid-template-columns: 1fr; }
}

@media (hover: none) {
  .stat-card:hover { box-shadow: var(--shadow-sm); border-color: var(--border); }
  .stat-card-featured:hover { border-color: #9acca8; }
  .quick-item:hover { background: var(--cream); border-color: var(--border); }
  .quick-item:hover .quick-item-icon { background: var(--primary-light); }
  .quick-item:hover .quick-item-arrow { transform: none; color: var(--gray-500); }
}

@media (prefers-reduced-motion: reduce) {
  .sk { animation: none; }
  .plan-progress-fill, .quick-item-arrow { transition: none; }
}
</style>

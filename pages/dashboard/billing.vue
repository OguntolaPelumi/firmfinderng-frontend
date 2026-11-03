<template>
  <NuxtLayout name="dashboard" title="Billing" subtitle="Manage your subscription and payment history">
    <div class="billing">

      <!-- Notice (replaces browser alerts) -->
      <div v-if="notice" class="notice" :class="`notice-${notice.type}`" role="status">
        <Icon :name="notice.type === 'success' ? 'ph:check-circle-fill' : 'ph:warning-circle-fill'" style="font-size:1.1rem;flex-shrink:0" />
        <span class="notice-text">{{ notice.text }}</span>
        <button type="button" class="notice-close" aria-label="Dismiss" @click="notice = null">
          <Icon name="ph:x" />
        </button>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="billing-wrap" aria-busy="true" aria-live="polite">
        <span class="sr-only">Loading billing info...</span>
        <div class="sk sk-current" />
        <div class="plans-grid">
          <div v-for="n in 4" :key="n" class="sk sk-plan" />
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="loadError" class="card error-card" role="alert">
        <div class="error-icon"><Icon name="ph:warning-circle-fill" style="font-size:1.5rem" /></div>
        <div class="error-text">
          <p class="error-title">We couldn't load your billing info</p>
          <p class="error-sub">Check your connection and try again.</p>
        </div>
        <button type="button" class="b-btn b-btn-primary" @click="loadStatus">
          <Icon name="ph:arrow-clockwise" /> Try again
        </button>
      </div>

      <div v-else class="billing-wrap">

        <!-- Current plan -->
        <section aria-labelledby="current-heading">
          <h2 id="current-heading" class="section-label">Current plan</h2>
          <div class="current-plan">
            <div class="current-plan-left">
              <div class="current-plan-icon">
                <Icon name="ph:crown-fill" style="font-size:1.35rem" />
              </div>
              <div class="current-plan-info">
                <p class="current-plan-name">{{ currentPlanName }} plan</p>
                <p class="current-plan-leads">{{ (status?.leads_remaining ?? 0).toLocaleString() }} leads remaining this month</p>
                <p v-if="status?.subscription?.expires_at" class="current-plan-expiry">
                  <Icon name="ph:calendar-blank" style="font-size:0.9rem" />
                  Renews {{ formatDate(status.subscription.expires_at, true) }}
                </p>
              </div>
            </div>
            <span class="plan-pill">{{ status?.plan || 'free' }}</span>
          </div>
        </section>

        <!-- Plans -->
        <section aria-labelledby="plans-heading">
          <h2 id="plans-heading" class="section-label">Available plans</h2>
          <div class="plans-grid">
            <div
              v-for="(plan, key) in plans"
              :key="key"
              class="plan-card"
              :class="{ 'plan-card-active': status?.plan === key, 'plan-card-featured': key === 'pro' }"
            >
              <div v-if="key === 'pro'" class="plan-popular-tag">Most Popular</div>
              <p class="plan-name">{{ plan.name }}</p>
              <div class="plan-price">
                <span class="plan-amount">{{ plan.price }}</span>
                <span class="plan-period">/month</span>
              </div>
              <ul class="plan-features">
                <li v-for="f in plan.features" :key="f">
                  <Icon name="ph:check-circle-fill" class="plan-check" />
                  <span>{{ f }}</span>
                </li>
              </ul>
              <div class="plan-action">
                <div v-if="status?.plan === key" class="plan-active-tag">
                  <Icon name="ph:check-circle-fill" /> Current plan
                </div>
                <button
                  v-else-if="key !== 'free'"
                  type="button"
                  class="b-btn b-btn-block"
                  :class="key === 'pro' ? 'b-btn-primary' : 'b-btn-outline'"
                  :disabled="!!subscribing"
                  @click="subscribe(key as string)"
                >
                  <span v-if="subscribing === key" class="spinner" aria-hidden="true" />
                  {{ subscribing === key ? 'Processing...' : actionLabel(key as string) }}
                </button>
              </div>
            </div>
          </div>
          <p class="secure-note">
            <Icon name="ph:lock-simple-fill" style="font-size:0.9rem" />
            Payments are processed securely by Paystack.
          </p>
        </section>

        <!-- Payment history -->
        <section aria-labelledby="history-heading">
          <h2 id="history-heading" class="section-label">Payment history</h2>
          <div class="table-card">
            <div v-if="!status?.recent_payments?.length" class="empty-payments">
              <div class="empty-icon"><Icon name="ph:receipt-fill" style="font-size:1.4rem" /></div>
              <p class="empty-title">No payments yet</p>
              <p class="empty-sub">Your payments will show up here after you subscribe to a paid plan.</p>
            </div>
            <table v-else class="pay-table">
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(p, i) in status.recent_payments" :key="p.reference ?? p.paid_at ?? i">
                  <td data-label="Amount" class="pay-amount">₦{{ Number(p.amount).toLocaleString() }}</td>
                  <td data-label="Status"><span class="pay-badge" :class="`pay-${p.status}`">{{ p.status }}</span></td>
                  <td data-label="Date" class="pay-date">{{ p.paid_at ? formatDate(p.paid_at) : '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { api } = useAuth()
const config = useRuntimeConfig()
const status = ref<any>(null)
const loading = ref(true)
const loadError = ref(false)
const subscribing = ref<string | null>(null)
const notice = ref<{ type: 'success' | 'error'; text: string } | null>(null)

const plans: Record<string, any> = {
  free: { name: 'Free', price: '₦0', kobo: 0, features: ['20 lead previews/month', 'Basic filters', 'No export'] },
  basic: { name: 'Basic', price: '₦15,000', kobo: 1500000, features: ['500 leads/month', 'CSV export', '1 industry filter', 'Email support'] },
  pro: { name: 'Pro', price: '₦35,000', kobo: 3500000, features: ['2,000 leads/month', 'Excel + CSV export', 'All industries', 'Competitor tracking', 'Market reports'] },
  enterprise: { name: 'Enterprise', price: '₦80,000', kobo: 8000000, features: ['Unlimited leads', 'API access', 'Weekly reports', 'Dedicated support'] },
}
const planOrder = ['free', 'basic', 'pro', 'enterprise']

const currentPlanName = computed(() => plans[status.value?.plan]?.name || 'Free')

const actionLabel = (key: string) => {
  const current = planOrder.indexOf(status.value?.plan || 'free')
  return planOrder.indexOf(key) > current ? `Upgrade to ${plans[key].name}` : `Switch to ${plans[key].name}`
}

const formatDate = (value: string, long = false) =>
  new Date(value).toLocaleDateString('en-NG', long
    ? { month: 'long', day: 'numeric', year: 'numeric' }
    : { month: 'short', day: 'numeric', year: 'numeric' })

const loadStatus = async () => {
  loading.value = true
  loadError.value = false
  try { status.value = await api('/subscriptions/status/') }
  catch { loadError.value = true }
  finally { loading.value = false }
}
onMounted(loadStatus)

const subscribe = async (plan: string) => {
  subscribing.value = plan
  notice.value = null
  try {
    const data: any = await api('/subscriptions/initiate/', { method: 'POST', body: { plan } })
    if (!(window as any).PaystackPop) throw new Error('Paystack not loaded')
    const handler = (window as any).PaystackPop.setup({
      key: config.public.paystackPublicKey,
      email: status.value?.user_email,
      amount: plans[plan].kobo,
      currency: 'NGN',
      ref: data.reference,
      onClose: () => { subscribing.value = null },
      callback: async (response: any) => {
        try {
          await api('/subscriptions/verify/', { method: 'POST', body: { reference: response.reference } })
          status.value = await api('/subscriptions/status/')
          notice.value = { type: 'success', text: 'Subscription activated. Your new plan is ready to use.' }
        } catch {
          notice.value = { type: 'error', text: 'We could not confirm your payment yet. If you were charged, refresh this page in a minute.' }
        } finally { subscribing.value = null }
      },
    })
    handler.openIframe()
  } catch {
    notice.value = { type: 'error', text: 'Payment could not be started. Please try again.' }
    subscribing.value = null
  }
}
</script>

<style scoped>
.billing {
  /* Nigerian flag green theme */
  --primary: #008751;
  --primary-dark: #006b41;
  --primary-light: #e8f5ee;
  --primary-border: #b7dfc9;
  font-family: var(--font);
  min-width: 0;
}

.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

.billing-wrap { display: flex; flex-direction: column; gap: 2rem; }
.card { background: var(--cream); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem; box-shadow: var(--shadow-sm); }
.section-label { font-size: 1rem; font-weight: 700; color: var(--gray-900); margin-bottom: 0.875rem; }

/* Buttons */
.b-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; height: 44px; padding: 0 1.1rem; font: inherit; font-size: 0.9rem; font-weight: 600; border-radius: var(--radius-md); border: 1px solid transparent; cursor: pointer; text-decoration: none; transition: background 0.15s, border-color 0.15s; }
.b-btn-block { width: 100%; }
.b-btn-primary { background: var(--primary); color: white; }
.b-btn-primary:hover:not(:disabled) { background: var(--primary-dark); }
.b-btn-outline { background: var(--cream); color: var(--primary); border-color: var(--primary); }
.b-btn-outline:hover:not(:disabled) { background: var(--primary-light); }
.b-btn:focus-visible { outline: 2px solid var(--primary-dark); outline-offset: 2px; }
.b-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
.b-btn-outline .spinner { border-color: rgba(0,135,81,0.3); border-top-color: var(--primary); }
@keyframes spin { to { transform: rotate(360deg); } }

/* Notice */
.notice { display: flex; align-items: flex-start; gap: 0.625rem; padding: 0.875rem 1rem; margin-bottom: 1.5rem; border-radius: var(--radius-md); font-size: 0.875rem; line-height: 1.45; border: 1px solid; }
.notice-text { flex: 1; }
.notice-success { background: var(--primary-light); border-color: var(--primary-border); color: var(--primary-dark); }
.notice-error { background: #fdf2f2; border-color: #f8b4b4; color: #9b1c1c; }
.notice-close { background: transparent; border: 0; color: inherit; cursor: pointer; padding: 2px; display: flex; opacity: 0.7; }
.notice-close:hover { opacity: 1; }

/* Current plan: landing CTA green, the one emphasized block */
.current-plan { background: linear-gradient(90deg, #9acca8 0%, #acd5b6 50%, #9acca8 100%); color: var(--gray-900); border-radius: var(--radius-lg); padding: 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; box-shadow: var(--shadow-sm); }
/* Brand green glows at both edges with a warm amber glow between them, same as the landing CTA */
.current-plan { position: relative; isolation: isolate; overflow: hidden; }
.current-plan::before {
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
@media (prefers-reduced-motion: reduce) { .current-plan::before { animation: none; } }
.current-plan-left { display: flex; align-items: center; gap: 1rem; min-width: 0; }
.current-plan-icon { width: 52px; height: 52px; background: rgba(255, 253, 243, 0.55); color: var(--primary); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.current-plan-info { min-width: 0; }
.current-plan-name { font-size: 1.2rem; font-weight: 800; }
.current-plan-leads { font-size: 0.9rem; color: var(--text-secondary); margin-top: 2px; }
.current-plan-expiry { display: flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px; }
.plan-pill { padding: 0.3rem 0.9rem; font-size: 0.8rem; font-weight: 700; text-transform: capitalize; color: var(--primary); background: var(--cream); border-radius: 999px; flex-shrink: 0; }

/* Plans: 4 / 2 / 1 columns */
.plans-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; padding-top: 0.75rem; }
.plan-card { background: var(--cream); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem; position: relative; transition: box-shadow 0.15s; display: flex; flex-direction: column; gap: 1rem; min-width: 0; }
.plan-card:hover { box-shadow: var(--shadow-md); }
.plan-card-active { border-color: var(--primary); background: var(--primary-light); }
.plan-card-featured { border-color: var(--primary); box-shadow: 0 0 0 1px var(--primary), var(--shadow-md); }
.plan-popular-tag { position: absolute; top: -13px; left: 50%; transform: translateX(-50%); background: var(--primary); color: white; font-size: 0.7rem; font-weight: 700; padding: 3px 14px; border-radius: 999px; white-space: nowrap; }
.plan-name { font-size: 0.95rem; font-weight: 700; color: var(--gray-700); }
.plan-price { display: flex; align-items: baseline; flex-wrap: wrap; gap: 2px; }
.plan-amount { font-size: 1.625rem; font-weight: 800; color: var(--gray-900); }
.plan-period { font-size: 0.8rem; color: var(--text-muted); }
.plan-features { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; flex: 1; }
.plan-features li { display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.825rem; color: var(--gray-700); }
.plan-check { color: var(--primary); font-size: 0.9rem; flex-shrink: 0; margin-top: 2px; }
.plan-action { margin-top: auto; }
.plan-active-tag { display: flex; align-items: center; justify-content: center; gap: 0.4rem; height: 44px; color: var(--primary-dark); font-weight: 700; font-size: 0.875rem; }
.secure-note { display: flex; align-items: center; gap: 0.4rem; margin-top: 1rem; font-size: 0.8rem; color: var(--text-muted); }

/* Payment history */
.table-card { background: var(--cream); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm); }
.empty-payments { padding: 3rem 1.5rem; text-align: center; }
.empty-icon { width: 52px; height: 52px; margin: 0 auto 0.875rem; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; }
.empty-title { font-weight: 700; color: var(--gray-900); margin-bottom: 0.25rem; }
.empty-sub { font-size: 0.85rem; color: var(--text-muted); max-width: 320px; margin: 0 auto; }

.pay-table { width: 100%; border-collapse: collapse; }
.pay-table th { text-align: left; padding: 0.75rem 1.25rem; font-size: 0.78rem; font-weight: 600; color: var(--text-muted); background: var(--primary-light); border-bottom: 1px solid var(--primary-border); }
.pay-table td { padding: 0.95rem 1.25rem; border-bottom: 1px solid var(--border); font-size: 0.875rem; }
.pay-table tbody tr:last-child td { border-bottom: 0; }
.pay-table tbody tr:hover { background: #F3EBC0; }
.pay-amount { font-weight: 700; color: var(--gray-900); }
.pay-date { color: var(--text-secondary); font-size: 0.85rem; }

.pay-badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; text-transform: capitalize; }
.pay-success { background: var(--primary-light); color: var(--primary-dark); }
.pay-pending { background: #fef3c7; color: #92400e; }
.pay-failed { background: #fde8e8; color: #b91c1c; }

/* Errors */
.error-card { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
.error-icon { width: 48px; height: 48px; border-radius: var(--radius-md); background: #fdf2f2; color: #b91c1c; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.error-text { flex: 1; min-width: 200px; }
.error-title { font-weight: 700; color: var(--gray-900); }
.error-sub { font-size: 0.85rem; color: var(--text-muted); }

/* Skeleton */
.sk { background: linear-gradient(90deg, #F3EBC0 25%, var(--cream) 50%, #F3EBC0 75%); background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite; border-radius: var(--radius-lg); }
@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
.sk-current { height: 100px; }
.sk-plan { height: 300px; }

/* ---------- Responsive ---------- */
@media (max-width: 1200px) {
  .plans-grid { grid-template-columns: repeat(2, 1fr); row-gap: 1.5rem; }
}

@media (max-width: 600px) {
  .billing-wrap { gap: 1.5rem; }
  .plans-grid { grid-template-columns: 1fr; }
  .card, .plan-card, .current-plan { padding: 1.25rem; }

  .current-plan { flex-direction: column; align-items: flex-start; }
  .current-plan-icon { width: 44px; height: 44px; }

  /* Payment history becomes stacked cards on phones */
  .pay-table, .pay-table tbody, .pay-table tr, .pay-table td { display: block; width: 100%; }
  .pay-table thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  .pay-table tr { padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); }
  .pay-table tbody tr:last-child { border-bottom: 0; }
  .pay-table td { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 0.35rem 0; border: 0; }
  .pay-table td::before { content: attr(data-label); font-size: 0.78rem; font-weight: 600; color: var(--text-muted); }
  .pay-table tbody tr:hover { background: transparent; }
}

@media (hover: none) {
  .plan-card:hover { box-shadow: none; }
  .plan-card-featured:hover { box-shadow: 0 0 0 1px var(--primary), var(--shadow-md); }
}

@media (prefers-reduced-motion: reduce) {
  .sk, .spinner { animation: none; }
}
</style>

<template>
  <NuxtLayout name="dashboard" title="Support" subtitle="Answers to common questions, or send us a message">
    <div class="support">

      <div class="support-grid">

        <!-- Common questions -->
        <section class="card" aria-labelledby="faq-heading">
          <h2 id="faq-heading" class="card-title">Common questions</h2>
          <div class="faq">
            <details v-for="item in faqs" :key="item.q" class="faq-item">
              <summary class="faq-q">
                <span>{{ item.q }}</span>
                <Icon name="ph:caret-down-bold" class="faq-caret" />
              </summary>
              <p class="faq-a">{{ item.a }}</p>
            </details>
          </div>
        </section>

        <!-- Contact form -->
        <section class="card" aria-labelledby="contact-heading">
          <h2 id="contact-heading" class="card-title">Send us a message</h2>

          <div v-if="sent" class="sent" role="status">
            <div class="sent-icon"><Icon name="ph:check-circle-fill" /></div>
            <p class="sent-title">Message sent</p>
            <p class="sent-text">Thanks{{ firstName ? `, ${firstName}` : '' }}. We'll reply to <strong>{{ user?.email }}</strong>, usually within one working day.</p>
            <button type="button" class="s-btn s-btn-outline" @click="resetForm">Send another message</button>
          </div>

          <form v-else class="form" novalidate @submit.prevent="submit">
            <p class="form-intro">We'll reply to <strong>{{ user?.email || 'your account email' }}</strong>.</p>

            <div class="field">
              <label for="support-topic">Topic</label>
              <select id="support-topic" v-model="form.topic" class="input select">
                <option v-for="t in topics" :key="t.value" :value="t.value">{{ t.label }}</option>
              </select>
            </div>

            <div class="field">
              <label for="support-subject">Subject</label>
              <input id="support-subject" v-model="form.subject" class="input" maxlength="150" placeholder="A short summary">
              <p v-if="errors.subject" class="field-error">{{ errors.subject }}</p>
            </div>

            <div class="field">
              <label for="support-message">Message</label>
              <textarea id="support-message" v-model="form.message" class="input textarea" rows="6" maxlength="4000" placeholder="Tell us what happened and what you expected" />
              <p v-if="errors.message" class="field-error">{{ errors.message }}</p>
            </div>

            <div v-if="error" class="form-error" role="alert">
              <Icon name="ph:warning-circle-fill" style="flex-shrink:0;margin-top:2px" />
              <span>{{ error }}</span>
            </div>

            <button type="submit" class="s-btn s-btn-primary" :disabled="sending">
              <span v-if="sending" class="spinner" aria-hidden="true" />
              <Icon v-else name="ph:paper-plane-tilt-fill" />
              {{ sending ? 'Sending...' : 'Send message' }}
            </button>
          </form>
        </section>

      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { api, user, paymentsEnabled } = useAuth()

const topics = [
  { value: 'account', label: 'Account and sign-in' },
  { value: 'leads', label: 'Leads and data' },
  { value: 'export', label: 'CSV export' },
  { value: 'billing', label: 'Plans and billing' },
  { value: 'other', label: 'Something else' },
]

const faqs = computed(() => [
  {
    q: 'How does the free trial work?',
    a: `New accounts can search every city, industry and state for free. You can unlock the full contact details of ${user.value?.leads_limit ?? 20} businesses by opening one and choosing "Reveal contact details", or by exporting it. Each business counts once. When the trial is used up, search and export are locked until you subscribe.`,
  },
  {
    q: 'How do I export leads to CSV?',
    a: 'On B2B Leads, tick the businesses you want and press "Export selected", or leave nothing ticked to export everything that matches your search and filters. One file holds up to 1,000 businesses.',
  },
  {
    q: "I didn't get my confirmation email",
    a: 'Check your spam or junk folder first. If it is not there, try signing in: you will be taken to the confirmation page, where "Resend confirmation email" sends a fresh link. Links expire after 24 hours.',
  },
  {
    q: 'How do I upgrade to a paid plan?',
    a: paymentsEnabled
      ? 'Open Billing in the menu and choose a plan. Payments are processed securely by Paystack.'
      : "Paid plans are coming soon. We're finishing payment setup, and you'll be able to subscribe from Billing as soon as it opens.",
  },
  {
    q: 'How do I change my details or password?',
    a: 'Open My Profile in the menu. You can update your name, company, phone and photo, and change your password at the bottom of the page.',
  },
])

const firstName = computed(() => (user.value?.full_name || '').split(' ')[0])

const blank = () => ({ topic: 'other', subject: '', message: '' })
const form = reactive(blank())
const errors = reactive<{ subject?: string; message?: string }>({})
const error = ref('')
const sending = ref(false)
const sent = ref(false)

const submit = async () => {
  errors.subject = form.subject.trim() ? '' : 'Add a short subject.'
  errors.message = form.message.trim().length >= 10 ? '' : 'Tell us a little more (at least 10 characters).'
  if (errors.subject || errors.message) return

  sending.value = true; error.value = ''
  try {
    await api('/auth/support/', { method: 'POST', body: { ...form } })
    sent.value = true
  } catch (err: any) {
    const data = err?.data || {}
    errors.subject = data.subject?.[0] || ''
    errors.message = data.message?.[0] || ''
    error.value = err?.status === 429
      ? 'You have sent several messages recently. Please wait a little and try again.'
      : errors.subject || errors.message ? '' : 'Your message could not be sent. Please try again.'
  } finally { sending.value = false }
}

const resetForm = () => {
  Object.assign(form, blank())
  errors.subject = ''; errors.message = ''
  sent.value = false
}
</script>

<style scoped>
.support {
  /* Nigerian flag green theme */
  --primary: #008751;
  --primary-dark: #006b41;
  --primary-light: #e8f5ee;
  --primary-border: #b7dfc9;
  font-family: var(--font);
  min-width: 0;
}

.support-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 1.25rem; align-items: start; }

.card { background: var(--cream); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem; box-shadow: var(--shadow-sm); }
.card-title { font-size: 1rem; font-weight: 700; color: var(--gray-900); margin-bottom: 1rem; }

/* FAQ */
.faq { display: flex; flex-direction: column; }
.faq-item { border-top: 1px solid var(--border); }
.faq-item:last-child { border-bottom: 1px solid var(--border); }
.faq-q { display: flex; align-items: center; justify-content: space-between; gap: 1rem; min-height: 48px; padding: 0.75rem 0; font-size: 0.9rem; font-weight: 600; color: var(--gray-900); cursor: pointer; list-style: none; }
.faq-q::-webkit-details-marker { display: none; }
.faq-q:hover { color: var(--primary-dark); }
.faq-q:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; border-radius: 4px; }
.faq-caret { flex-shrink: 0; font-size: 0.85rem; color: var(--primary); transition: transform 0.2s; }
.faq-item[open] .faq-caret { transform: rotate(180deg); }
.faq-a { padding: 0 0 1rem; font-size: 0.875rem; line-height: 1.6; color: var(--text-secondary); }

/* Form */
.form { display: flex; flex-direction: column; gap: 1rem; }
.form-intro { font-size: 0.85rem; color: var(--text-secondary); }
.form-intro strong { color: var(--gray-900); word-break: break-all; }
.field { display: flex; flex-direction: column; gap: 0.375rem; min-width: 0; }
.field label { font-size: 0.82rem; font-weight: 600; color: var(--gray-700); }
.field .input { height: 44px; font-size: 1rem; }
.field .textarea { height: auto; min-height: 140px; resize: vertical; line-height: 1.5; padding-top: 0.625rem; }
.select { appearance: none; -webkit-appearance: none; padding-right: 2.25rem; cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='none' stroke='%236b7280' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' d='M2.5 4.5 6 8l3.5-3.5'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 0.8rem center; }
.input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(0,135,81,0.18); }
.field-error { font-size: 0.78rem; color: #b91c1c; }
.form-error { display: flex; align-items: flex-start; gap: 0.5rem; padding: 0.75rem 0.875rem; font-size: 0.85rem; line-height: 1.4; color: #9b1c1c; background: #fdf2f2; border: 1px solid #f8b4b4; border-radius: var(--radius-md); }

.s-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; height: 46px; padding: 0 1.25rem; font: inherit; font-size: 0.9rem; font-weight: 700; border-radius: var(--radius-md); border: 1px solid transparent; cursor: pointer; transition: background 0.15s; }
.s-btn-primary { background: var(--primary); color: #fff; }
.s-btn-primary:hover:not(:disabled) { background: var(--primary-dark); }
.s-btn-outline { background: var(--cream); color: var(--primary); border-color: var(--primary); }
.s-btn-outline:hover { background: var(--primary-light); }
.s-btn:focus-visible { outline: 2px solid var(--primary-dark); outline-offset: 2px; }
.s-btn:disabled { opacity: 0.7; cursor: not-allowed; }
.spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Sent */
.sent { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1.5rem 0.5rem; text-align: center; }
.sent-icon { width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 1.6rem; color: var(--primary); background: var(--primary-light); margin-bottom: 0.25rem; }
.sent-title { font-size: 1.05rem; font-weight: 700; color: var(--gray-900); }
.sent-text { font-size: 0.875rem; line-height: 1.6; color: var(--text-secondary); margin-bottom: 0.75rem; }
.sent-text strong { color: var(--gray-900); word-break: break-all; }

/* Phones and narrow tablets: one column, form first so it's easy to reach */
@media (max-width: 900px) {
  .support-grid { grid-template-columns: 1fr; }
  .support-grid > :last-child { order: -1; }
  .s-btn-primary { width: 100%; }
}
@media (max-width: 480px) {
  .card { padding: 1.25rem 1rem; }
}
@media (prefers-reduced-motion: reduce) {
  .faq-caret { transition: none; }
  .spinner { animation-duration: 1.5s; }
}
</style>

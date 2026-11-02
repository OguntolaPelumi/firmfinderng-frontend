<template>
  <div class="auth-wrap">

    <!-- Brand panel -->
    <aside class="auth-left">
      <div class="auth-left-content">
        <NuxtLink to="/" class="auth-brand" aria-label="FirmFinderNG home">
          <div class="auth-brand-mark">
            <Icon name="ph:database-fill" style="font-size:1.25rem;color:white" />
          </div>
          <span class="auth-brand-name">FirmFinder<span>NG</span></span>
        </NuxtLink>

        <h2 class="auth-left-title">Start accessing Nigerian business intelligence today</h2>

        <ul class="auth-left-list">
          <li v-for="item in benefits" :key="item">
            <Icon name="ph:check-circle-fill" class="auth-check" />
            <span>{{ item }}</span>
          </li>
        </ul>

        <p class="auth-left-foot">by NewHeaven IT Solutions</p>
      </div>
    </aside>

    <!-- Form panel -->
    <main class="auth-right">
      <div class="auth-card">
        <NuxtLink to="/" class="auth-back">
          <Icon name="ph:arrow-left" style="font-size:0.9rem" /> Back to home
        </NuxtLink>

        <h1 class="auth-title">Create your account</h1>
        <p class="auth-sub">Free forever. No payment details required.</p>

        <form class="auth-form" novalidate @submit.prevent="handleRegister">
          <div class="auth-row">
            <div class="auth-field">
              <label class="auth-label" for="reg-name">Full name *</label>
              <input id="reg-name" v-model="form.full_name" type="text" class="auth-input" placeholder="Enter full name" autocomplete="name" />
            </div>
            <div class="auth-field">
              <label class="auth-label" for="reg-username">Username *</label>
              <input id="reg-username" v-model="form.username" type="text" class="auth-input" placeholder="Enter username" autocomplete="username" autocapitalize="none" />
            </div>
          </div>

          <div class="auth-field">
            <label class="auth-label" for="reg-email">Email address *</label>
            <input id="reg-email" v-model="form.email" type="email" class="auth-input" placeholder="you@company.com" autocomplete="email" inputmode="email" />
          </div>

          <div class="auth-row">
            <div class="auth-field">
              <label class="auth-label" for="reg-company">Company name</label>
              <input id="reg-company" v-model="form.company_name" type="text" class="auth-input" placeholder="Your company" autocomplete="organization" />
            </div>
            <div class="auth-field">
              <label class="auth-label" for="reg-phone">Phone</label>
              <input id="reg-phone" v-model="form.phone" type="tel" class="auth-input" placeholder="+234 xxx" autocomplete="tel" inputmode="tel" />
            </div>
          </div>

          <div class="auth-row">
            <div class="auth-field">
              <label class="auth-label" for="reg-password">Password *</label>
              <div class="auth-input-wrap">
                <input id="reg-password" v-model="form.password" :type="showPassword ? 'text' : 'password'" class="auth-input auth-input-password" placeholder="Min 8 chars" autocomplete="new-password" />
                <button type="button" class="auth-eye" :aria-label="showPassword ? 'Hide passwords' : 'Show passwords'" @click="showPassword = !showPassword">
                  <Icon :name="showPassword ? 'ph:eye-slash' : 'ph:eye'" style="font-size:1.1rem" />
                </button>
              </div>
            </div>
            <div class="auth-field">
              <label class="auth-label" for="reg-password2">Confirm password *</label>
              <input id="reg-password2" v-model="form.password2" :type="showPassword ? 'text' : 'password'" class="auth-input" placeholder="Repeat" autocomplete="new-password" />
            </div>
          </div>

          <div v-if="error" class="auth-error" role="alert">
            <Icon name="ph:warning-fill" style="flex-shrink:0;margin-top:2px" />
            <span>{{ error }}</span>
          </div>

          <button type="submit" class="auth-submit" :disabled="loading">
            <span v-if="loading" class="auth-spinner" aria-hidden="true" />
            {{ loading ? 'Creating account...' : 'Create Free Account' }}
          </button>
        </form>

        <p class="auth-switch">
          Already have an account? <NuxtLink to="/login">Sign in</NuxtLink>
        </p>
      </div>
    </main>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'guest' })
const { register } = useAuth()
const router = useRouter()
const form = reactive({ full_name: '', email: '', company_name: '', phone: '', username: '', password: '', password2: '' })
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)
const benefits = ['20 free leads every month', 'No payment details required', 'Instant access to dashboard', 'Upgrade anytime']

const handleRegister = async () => {
  if (!form.full_name || !form.email || !form.username || !form.password) { error.value = 'Please fill in all required fields.'; return }
  if (form.password !== form.password2) { error.value = 'Passwords do not match.'; return }
  loading.value = true; error.value = ''
  try { await register(form); router.push('/dashboard') }
  catch (err: any) {
    const data = err?.data || {}
    error.value = Object.values(data).flat().join(' ') || 'Registration failed. Please try again.'
  } finally { loading.value = false }
}
</script>

<style scoped>
.auth-wrap {
  /* Nigerian flag green theme */
  --primary: #008751;
  --primary-dark: #006b41;
  --primary-light: #e8f5ee;
  --primary-border: #b7dfc9;

  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  font-family: var(--font);
}

/* ---------- Brand panel ---------- */
.auth-left {
  width: 400px;
  flex-shrink: 0;
  padding: 3rem;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  background: var(--primary);
  background-image: linear-gradient(90deg, transparent 33.33%, rgba(255,255,255,0.07) 33.33%, rgba(255,255,255,0.07) 66.66%, transparent 66.66%);
}
.auth-left-content { width: 100%; position: relative; }

.auth-brand { display: inline-flex; align-items: center; gap: 0.625rem; margin-bottom: 2.5rem; text-decoration: none; }
.auth-brand-mark { width: 36px; height: 36px; background: rgba(255,255,255,0.2); border-radius: var(--radius); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.auth-brand-name { font-size: 1.2rem; font-weight: 800; color: white; }
.auth-brand-name span { color: #b8f0d2; }

.auth-left-title { font-size: 1.65rem; font-weight: 700; color: white; line-height: 1.25; letter-spacing: -0.01em; margin-bottom: 2rem; }

.auth-left-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.875rem; }
.auth-left-list li { display: flex; align-items: center; gap: 0.75rem; color: rgba(255,255,255,0.9); font-size: 0.925rem; }
.auth-check { color: #b8f0d2; font-size: 1.05rem; flex-shrink: 0; }

.auth-left-foot { margin-top: 3rem; font-size: 0.78rem; color: rgba(255,255,255,0.65); }

/* ---------- Form panel ---------- */
.auth-right {
  flex: 1;
  display: flex;
  padding: 2rem;
  background-color: var(--bg);
  background-image: var(--bg-fade);
  overflow-y: auto;
  min-width: 0;
}

.auth-card {
  width: 100%;
  max-width: 500px;
  margin: auto; /* centers vertically, but never clips when the card is taller than the screen */
  padding: 2.25rem;
  background: white;
  border: 1px solid var(--border);
  border-top: 4px solid var(--primary);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-lg);
}

.auth-back { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; color: var(--text-muted); text-decoration: none; margin-bottom: 1.5rem; transition: color 0.15s; }
.auth-back:hover { color: var(--primary); }

.auth-title { font-size: 1.625rem; font-weight: 800; color: var(--gray-900); letter-spacing: -0.01em; margin-bottom: 0.25rem; }
.auth-sub { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.5rem; }

.auth-form { display: flex; flex-direction: column; gap: 1rem; }
.auth-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.auth-field { display: flex; flex-direction: column; gap: 0.375rem; min-width: 0; }
.auth-label { font-size: 0.825rem; font-weight: 600; color: var(--gray-700); }

/* Inputs */
.auth-input-wrap { position: relative; }
.auth-input {
  width: 100%;
  height: 44px;
  padding: 0 0.875rem;
  font: inherit;
  font-size: 1rem; /* 16px prevents iOS zoom on focus */
  color: var(--gray-900);
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.auth-input::placeholder { color: var(--gray-500); opacity: 0.8; }
.auth-input:hover { border-color: var(--gray-500); }
.auth-input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(0,135,81,0.18); }
.auth-input-password { padding-right: 2.75rem; }

.auth-eye { position: absolute; right: 0.25rem; top: 50%; transform: translateY(-50%); width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: transparent; border: 0; border-radius: var(--radius); color: var(--gray-500); cursor: pointer; }
.auth-eye:hover { color: var(--primary); background: var(--primary-light); }
.auth-eye:focus-visible { outline: 2px solid var(--primary); outline-offset: 1px; }

/* Error */
.auth-error { display: flex; align-items: flex-start; gap: 0.5rem; padding: 0.75rem 0.875rem; font-size: 0.85rem; line-height: 1.4; color: #9b1c1c; background: #fdf2f2; border: 1px solid #f8b4b4; border-radius: var(--radius-md); }

/* Submit */
.auth-submit {
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  width: 100%; height: 48px; margin-top: 0.25rem;
  font: inherit; font-size: 1rem; font-weight: 700; color: white;
  background: var(--primary); border: 0; border-radius: var(--radius-md);
  cursor: pointer; transition: background 0.15s, transform 0.05s;
}
.auth-submit:hover:not(:disabled) { background: var(--primary-dark); }
.auth-submit:active:not(:disabled) { transform: translateY(1px); }
.auth-submit:focus-visible { outline: 2px solid var(--primary-dark); outline-offset: 2px; }
.auth-submit:disabled { opacity: 0.75; cursor: not-allowed; }

.auth-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: auth-spin 0.7s linear infinite; }
@keyframes auth-spin { to { transform: rotate(360deg); } }

.auth-switch { text-align: center; margin-top: 1.5rem; font-size: 0.875rem; color: var(--text-muted); }
.auth-switch a { color: var(--primary); font-weight: 600; text-decoration: none; }
.auth-switch a:hover { text-decoration: underline; }

/* ---------- Responsive ---------- */
@media (max-width: 1024px) {
  .auth-left { width: 320px; padding: 2.25rem; }
  .auth-left-title { font-size: 1.35rem; }
}

/* Stack: compact green header on top, form below */
@media (max-width: 768px) {
  .auth-wrap { flex-direction: column; }
  .auth-left { width: 100%; padding: 1.5rem 1.25rem 3.5rem; align-items: flex-start; }
  .auth-brand { margin-bottom: 1rem; }
  .auth-left-title { font-size: 1.15rem; margin-bottom: 0; max-width: 28rem; }
  .auth-left-list, .auth-left-foot { display: none; }

  .auth-right { padding: 0 1.25rem 2rem; overflow-y: visible; }
  .auth-card { margin: -2.25rem auto 0; padding: 2rem 1.5rem; }
}

/* Single-column fields on phones */
@media (max-width: 560px) {
  .auth-row { grid-template-columns: 1fr; gap: 1rem; }
}

@media (max-width: 380px) {
  .auth-right { padding-left: 1rem; padding-right: 1rem; }
  .auth-card { padding: 1.5rem 1.25rem; }
  .auth-title { font-size: 1.4rem; }
}

@media (prefers-reduced-motion: reduce) {
  .auth-spinner { animation-duration: 1.5s; }
  .auth-input, .auth-submit { transition: none; }
}
</style>

<template>
  <main class="verify-wrap">
    <div class="verify-card">
      <NuxtLink to="/" class="verify-brand" aria-label="FirmFinderNG home">
        <div class="verify-brand-mark">
          <Icon name="ph:database-fill" style="font-size:1.1rem;color:var(--sand)" />
        </div>
        <span class="verify-brand-name">FirmFinder<span>NG</span></span>
      </NuxtLink>

      <!-- Opened from the email link -->
      <template v-if="state === 'verifying'">
        <div class="verify-icon"><span class="verify-spinner" aria-hidden="true" /></div>
        <h1 class="verify-title">Confirming your email…</h1>
        <p class="verify-sub" role="status">This only takes a moment.</p>
      </template>

      <template v-else-if="state === 'verified'">
        <div class="verify-icon verify-icon-ok"><Icon name="ph:check-circle-fill" /></div>
        <h1 class="verify-title">Email confirmed</h1>
        <p class="verify-sub" role="status">Taking you to your dashboard…</p>
        <NuxtLink to="/dashboard" class="verify-btn">Go to dashboard</NuxtLink>
      </template>

      <template v-else-if="state === 'failed'">
        <div class="verify-icon verify-icon-warn"><Icon name="ph:warning-circle-fill" /></div>
        <h1 class="verify-title">{{ failure === 'token_expired' ? 'This link has expired' : 'This link is not valid' }}</h1>
        <p class="verify-sub">Enter your email and we'll send you a fresh confirmation link.</p>
      </template>

      <!-- Just registered, or tried to sign in before confirming -->
      <template v-else>
        <div class="verify-icon"><Icon name="ph:envelope-simple-open-fill" /></div>
        <h1 class="verify-title">{{ reason === 'unverified' ? 'Confirm your email first' : 'Check your inbox' }}</h1>
        <p class="verify-sub">
          <template v-if="reason === 'unverified'">You need to confirm your email address before you can sign in.</template>
          We sent a confirmation link to
          <strong v-if="email">{{ email }}</strong><template v-else>your email address</template>.
          Click it to open your dashboard. The link expires in 24 hours.
        </p>
        <p class="verify-hint">Can't find it? Check your spam or promotions folder.</p>
      </template>

      <!-- Resend -->
      <form v-if="state === 'pending' || state === 'failed'" class="verify-resend" novalidate @submit.prevent="handleResend">
        <template v-if="state === 'failed' || !email">
          <label class="verify-label" for="verify-email">Email address</label>
          <input id="verify-email" v-model="email" type="email" class="verify-input" placeholder="you@company.com" autocomplete="email" inputmode="email" />
        </template>

        <div v-if="notice" class="verify-notice" :class="{ 'verify-notice-error': noticeIsError }" role="status">{{ notice }}</div>

        <button type="submit" class="verify-btn" :class="{ 'verify-btn-outline': state === 'pending' }" :disabled="sending || cooldown > 0">
          <span v-if="sending" class="verify-spinner verify-spinner-sm" aria-hidden="true" />
          {{ sending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend confirmation email' }}
        </button>
      </form>

      <p class="verify-switch">
        Already confirmed? <NuxtLink to="/login">Sign in</NuxtLink>
      </p>
    </div>
  </main>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { verifyEmail, resendVerification } = useAuth()

const token = typeof route.query.token === 'string' ? route.query.token : ''
const reason = typeof route.query.reason === 'string' ? route.query.reason : ''
const email = ref(typeof route.query.email === 'string' ? route.query.email : '')

const state = ref<'pending' | 'verifying' | 'verified' | 'failed'>(token ? 'verifying' : 'pending')
const failure = ref('')
const sending = ref(false)
const notice = ref('')
const noticeIsError = ref(false)
const cooldown = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

const startCooldown = (seconds = 60) => {
  cooldown.value = seconds
  clearInterval(timer)
  timer = setInterval(() => {
    cooldown.value -= 1
    if (cooldown.value <= 0) clearInterval(timer)
  }, 1000)
}

const handleResend = async () => {
  if (!email.value) { notice.value = 'Enter the email you signed up with.'; noticeIsError.value = true; return }
  sending.value = true; notice.value = ''
  try {
    await resendVerification(email.value)
    notice.value = `If ${email.value} still needs confirming, a new link is on its way.`
    noticeIsError.value = false
    startCooldown()
  } catch (err: any) {
    noticeIsError.value = true
    notice.value = err?.status === 429
      ? 'Too many requests. Please wait a few minutes and try again.'
      : 'Could not send the email. Please try again.'
  } finally { sending.value = false }
}

onMounted(async () => {
  // Fresh registration: the first email was just sent, so hold off the resend button briefly
  if (!token && !reason) startCooldown(30)
  if (!token) return
  try {
    await verifyEmail(token)
    state.value = 'verified'
    setTimeout(() => router.replace('/dashboard'), 1200)
  } catch (err: any) {
    failure.value = err?.data?.code || 'token_invalid'
    state.value = 'failed'
  }
})

onBeforeUnmount(() => clearInterval(timer))
</script>

<style scoped>
.verify-wrap {
  --primary: #008751;
  --primary-dark: #006b41;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  padding: 2rem 1rem;
  background: linear-gradient(180deg, #00603a 0, #007446 220px, var(--sand) 220px);
  font-family: var(--font);
}

.verify-card {
  width: 100%;
  max-width: 460px;
  margin: auto;
  padding: 2.25rem;
  text-align: center;
  background: var(--cream);
  border: 1px solid var(--border);
  border-top: 4px solid var(--primary);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-lg);
}

.verify-brand { display: inline-flex; align-items: center; gap: 0.5rem; margin-bottom: 1.75rem; text-decoration: none; }
.verify-brand-mark { width: 32px; height: 32px; border-radius: var(--radius); background: #00603a; display: flex; align-items: center; justify-content: center; }
.verify-brand-name { font-size: 1.1rem; font-weight: 800; color: var(--gray-900); }

.verify-icon { width: 64px; height: 64px; margin: 0 auto 1.25rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: var(--primary); background: var(--sand); }
.verify-icon-ok { color: #fff; background: var(--primary); }
.verify-icon-warn { color: #9b1c1c; background: #fdf2f2; }

.verify-title { font-size: 1.5rem; font-weight: 800; color: var(--gray-900); letter-spacing: -0.01em; margin-bottom: 0.5rem; }
.verify-sub { font-size: 0.925rem; line-height: 1.55; color: var(--text-secondary); margin-bottom: 0.75rem; }
.verify-sub strong { color: var(--gray-900); word-break: break-all; }
.verify-hint { font-size: 0.82rem; color: var(--text-muted); }

.verify-resend { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1.5rem; text-align: left; }
.verify-label { font-size: 0.825rem; font-weight: 600; color: var(--gray-700); }
.verify-input {
  width: 100%; height: 44px; padding: 0 0.875rem; margin-bottom: 0.25rem;
  font: inherit; font-size: 1rem; color: var(--gray-900);
  background: var(--input-bg); border: 1px solid var(--input-border); border-radius: var(--radius-md);
  caret-color: var(--primary);
}
.verify-input::placeholder { color: var(--placeholder); opacity: 1; }
.verify-input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(0,135,81,0.18); }

.verify-notice { padding: 0.625rem 0.75rem; font-size: 0.85rem; line-height: 1.4; color: #00603a; background: #e3f2e8; border: 1px solid #b7dfc9; border-radius: var(--radius-md); }
.verify-notice-error { color: #9b1c1c; background: #fdf2f2; border-color: #f8b4b4; }

.verify-btn {
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  width: 100%; height: 48px; margin-top: 0.5rem;
  font: inherit; font-size: 0.95rem; font-weight: 700; color: #fff; text-decoration: none;
  background: var(--primary); border: 1px solid var(--primary); border-radius: var(--radius-md);
  cursor: pointer; transition: background 0.15s;
}
.verify-btn:hover:not(:disabled) { background: var(--primary-dark); }
.verify-btn:focus-visible { outline: 2px solid var(--primary-dark); outline-offset: 2px; }
.verify-btn:disabled { opacity: 0.7; cursor: not-allowed; }
.verify-btn-outline { color: var(--primary-dark); background: transparent; }
.verify-btn-outline:hover:not(:disabled) { color: #fff; }
.verify-btn-outline .verify-spinner-sm { border-color: rgba(0,135,81,0.25); border-top-color: var(--primary); }

.verify-spinner { width: 28px; height: 28px; border: 3px solid rgba(0,135,81,0.25); border-top-color: var(--primary); border-radius: 50%; animation: verify-spin 0.7s linear infinite; }
.verify-spinner-sm { width: 16px; height: 16px; border-width: 2px; border-color: rgba(255,255,255,0.4); border-top-color: #fff; }
@keyframes verify-spin { to { transform: rotate(360deg); } }

.verify-switch { margin-top: 1.5rem; font-size: 0.875rem; color: var(--text-muted); }
.verify-switch a { color: var(--primary); font-weight: 600; text-decoration: none; }
.verify-switch a:hover { text-decoration: underline; }

@media (max-width: 480px) {
  .verify-card { padding: 1.75rem 1.25rem; }
  .verify-title { font-size: 1.3rem; }
}

@media (prefers-reduced-motion: reduce) {
  .verify-spinner { animation-duration: 1.5s; }
}
</style>

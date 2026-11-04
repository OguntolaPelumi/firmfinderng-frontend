<template>
  <NuxtLayout name="dashboard" title="My Profile" subtitle="Manage your personal and business details">
    <div class="profile">

      <!-- Notice -->
      <div v-if="notice" class="notice" :class="`notice-${notice.type}`" role="status">
        <Icon :name="notice.type === 'success' ? 'ph:check-circle-fill' : 'ph:warning-circle-fill'" style="font-size:1.1rem;flex-shrink:0" />
        <span class="notice-text">{{ notice.text }}</span>
        <button type="button" class="notice-close" aria-label="Dismiss" @click="notice = null">
          <Icon name="ph:x" />
        </button>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="profile-wrap" aria-busy="true" aria-live="polite">
        <span class="sr-only">Loading profile...</span>
        <div class="sk sk-hero" />
        <div class="sk sk-card" />
        <div class="sk sk-card" />
      </div>

      <!-- Error state -->
      <div v-else-if="loadError" class="card error-card" role="alert">
        <div class="error-icon"><Icon name="ph:warning-circle-fill" style="font-size:1.5rem" /></div>
        <div class="error-text">
          <p class="error-title">We couldn't load your profile</p>
          <p class="error-sub">Check your connection and try again.</p>
        </div>
        <button type="button" class="p-btn p-btn-primary" @click="loadProfile">
          <Icon name="ph:arrow-clockwise" /> Try again
        </button>
      </div>

      <div v-else class="profile-wrap">

        <!-- Hero: avatar + identity -->
        <section class="hero" aria-label="Profile summary">
          <div class="hero-left">
            <div class="avatar">
              <img v-if="avatarPreview" :src="avatarPreview" alt="Your avatar" class="avatar-img">
              <span v-else aria-hidden="true">{{ initials }}</span>
            </div>
            <div class="hero-info">
              <p class="hero-name">{{ form.full_name || profile.email }}</p>
              <p class="hero-meta">
                <span v-if="form.job_title">{{ form.job_title }}</span>
                <span v-if="form.job_title && form.company_name"> · </span>
                <span v-if="form.company_name">{{ form.company_name }}</span>
              </p>
              <p class="hero-since">
                <Icon name="ph:calendar-blank" style="font-size:0.9rem" />
                Member since {{ formatDate(profile.date_joined) }}
              </p>
            </div>
          </div>
          <div class="hero-actions">
            <span class="plan-pill">{{ freeAccess ? 'Free access' : profile.subscription_plan }}</span>
            <div class="avatar-btns">
              <label class="p-btn p-btn-light p-btn-sm">
                <Icon name="ph:camera-bold" /> {{ profile.avatar || avatarFile ? 'Change photo' : 'Upload photo' }}
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="sr-only" @change="onAvatarPicked">
              </label>
              <button v-if="profile.avatar || avatarFile" type="button" class="p-btn p-btn-ghost p-btn-sm" @click="removeAvatar">
                Remove
              </button>
            </div>
          </div>
        </section>

        <form class="profile-form" novalidate @submit.prevent="saveProfile">

          <!-- Personal info -->
          <section class="card" aria-labelledby="personal-heading">
            <h2 id="personal-heading" class="section-label">Personal information</h2>
            <div class="grid">
              <div class="field">
                <label for="full_name">Full name</label>
                <input id="full_name" v-model="form.full_name" class="input" maxlength="50" autocomplete="name">
                <p v-if="errors.full_name" class="field-error">{{ errors.full_name }}</p>
              </div>
              <div class="field">
                <label for="email">Email</label>
                <input id="email" :value="profile.email" class="input" disabled>
                <p class="field-hint">Contact support to change your email.</p>
              </div>
              <div class="field">
                <label for="phone">Phone</label>
                <input id="phone" v-model="form.phone" class="input" maxlength="20" autocomplete="tel" placeholder="+234 800 000 0000">
                <p v-if="errors.phone" class="field-error">{{ errors.phone }}</p>
              </div>
              <div class="field">
                <label for="job_title">Job title</label>
                <input id="job_title" v-model="form.job_title" class="input" maxlength="100" placeholder="e.g. Sales Manager">
                <p v-if="errors.job_title" class="field-error">{{ errors.job_title }}</p>
              </div>
              <div class="field field-full">
                <label for="bio">Bio</label>
                <textarea id="bio" v-model="form.bio" class="input textarea" maxlength="500" rows="3" placeholder="Tell us a little about yourself and what you're looking for." />
                <p class="field-hint">{{ form.bio.length }}/500</p>
                <p v-if="errors.bio" class="field-error">{{ errors.bio }}</p>
              </div>
            </div>
          </section>

          <!-- Business -->
          <section class="card" aria-labelledby="business-heading">
            <h2 id="business-heading" class="section-label">Business & location</h2>
            <div class="grid">
              <div class="field">
                <label for="company_name">Company name</label>
                <input id="company_name" v-model="form.company_name" class="input" maxlength="155" autocomplete="organization">
                <p v-if="errors.company_name" class="field-error">{{ errors.company_name }}</p>
              </div>
              <div class="field">
                <label for="industry">Industry</label>
                <select id="industry" v-model="form.industry" class="input">
                  <option :value="null">Select industry</option>
                  <option v-for="ind in industries" :key="ind.slug" :value="ind.slug">{{ ind.name }}</option>
                </select>
                <p v-if="errors.industry" class="field-error">{{ errors.industry }}</p>
              </div>
              <div class="field">
                <label for="state">State</label>
                <select id="state" v-model="form.state" class="input">
                  <option :value="null">Select state</option>
                  <option v-for="s in states" :key="s.slug" :value="s.slug">{{ s.name }}</option>
                </select>
                <p v-if="errors.state" class="field-error">{{ errors.state }}</p>
              </div>
              <div class="field">
                <label for="city">City</label>
                <input id="city" v-model="form.city" class="input" maxlength="100" placeholder="e.g. Ikeja">
                <p v-if="errors.city" class="field-error">{{ errors.city }}</p>
              </div>
              <div class="field">
                <label for="website">Website</label>
                <input id="website" v-model="form.website" type="url" class="input" placeholder="https://example.com">
                <p v-if="errors.website" class="field-error">{{ errors.website }}</p>
              </div>
              <div class="field">
                <label for="linkedin">LinkedIn</label>
                <input id="linkedin" v-model="form.linkedin" type="url" class="input" placeholder="https://linkedin.com/in/you">
                <p v-if="errors.linkedin" class="field-error">{{ errors.linkedin }}</p>
              </div>
            </div>
          </section>

          <!-- Preferences -->
          <section class="card" aria-labelledby="prefs-heading">
            <h2 id="prefs-heading" class="section-label">Preferences</h2>
            <label class="toggle-row">
              <div>
                <p class="toggle-title">Email notifications</p>
                <p class="toggle-sub">Product updates, new market reports and account alerts.</p>
              </div>
              <input v-model="form.email_notifications" type="checkbox" class="toggle">
            </label>
          </section>

          <div class="form-actions">
            <button type="button" class="p-btn p-btn-outline" :disabled="saving || !dirty" @click="resetForm">Discard changes</button>
            <button type="submit" class="p-btn p-btn-primary" :disabled="saving || !dirty">
              <span v-if="saving" class="spinner" aria-hidden="true" />
              {{ saving ? 'Saving...' : 'Save changes' }}
            </button>
          </div>
        </form>

        <!-- Change password -->
        <section class="card" aria-labelledby="password-heading">
          <h2 id="password-heading" class="section-label">Change password</h2>
          <form class="grid" novalidate @submit.prevent="changePassword">
            <div class="field">
              <label for="old_password">Current password</label>
              <input id="old_password" v-model="pw.old_password" type="password" class="input" autocomplete="current-password" required>
            </div>
            <div class="field">
              <label for="new_password">New password</label>
              <input id="new_password" v-model="pw.new_password" type="password" class="input" autocomplete="new-password" required>
            </div>
            <p v-if="pwError" class="field-error field-full">{{ pwError }}</p>
            <div class="field-full pw-actions">
              <button type="submit" class="p-btn p-btn-outline" :disabled="pwSaving || !pw.old_password || !pw.new_password">
                <span v-if="pwSaving" class="spinner" aria-hidden="true" />
                {{ pwSaving ? 'Updating...' : 'Update password' }}
              </button>
            </div>
          </form>
        </section>

      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { api, fetchUser, freeAccess } = useAuth()

const EDITABLE = ['full_name', 'company_name', 'phone', 'job_title', 'bio', 'industry', 'state', 'city', 'website', 'linkedin', 'email_notifications'] as const
const MAX_AVATAR = 2 * 1024 * 1024

const profile = ref<any>(null)
const form = reactive<Record<string, any>>({ bio: '' })
const errors = ref<Record<string, string>>({})
const industries = ref<any[]>([])
const states = ref<any[]>([])
const loading = ref(true)
const loadError = ref(false)
const saving = ref(false)
const notice = ref<{ type: 'success' | 'error'; text: string } | null>(null)

const avatarFile = ref<File | null>(null)
const avatarRemoved = ref(false)
const avatarPreview = ref<string | null>(null)

const pw = reactive({ old_password: '', new_password: '' })
const pwSaving = ref(false)
const pwError = ref('')

const dirty = computed(() =>
  !!profile.value && (
    !!avatarFile.value || avatarRemoved.value ||
    EDITABLE.some(k => (form[k] ?? '') !== (profile.value[k] ?? ''))
  ))

const initials = computed(() => {
  const name = form.full_name || profile.value?.email || 'U'
  return name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
})

const formatDate = (value: string) =>
  value ? new Date(value).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' }) : ''

const firstError = (v: any) => (Array.isArray(v) ? v[0] : String(v))

const resetForm = () => {
  for (const k of EDITABLE) form[k] = profile.value[k] ?? (k === 'email_notifications' ? true : k === 'industry' || k === 'state' ? null : '')
  if (avatarPreview.value?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview.value)
  avatarFile.value = null
  avatarRemoved.value = false
  avatarPreview.value = profile.value.avatar
  errors.value = {}
}

const loadProfile = async () => {
  loading.value = true
  loadError.value = false
  try {
    const [p, i, s]: any = await Promise.all([
      api('/profiles/me/'),
      api('/businesses/industries/'),
      api('/businesses/states/'),
    ])
    profile.value = p
    industries.value = i.results || i
    states.value = s.results || s
    resetForm()
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}
onMounted(loadProfile)
onBeforeUnmount(() => { if (avatarPreview.value?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview.value) })

const onAvatarPicked = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (file.size > MAX_AVATAR) {
    notice.value = { type: 'error', text: 'Photo must be 2 MB or smaller.' }
    return
  }
  if (avatarPreview.value?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview.value)
  avatarFile.value = file
  avatarRemoved.value = false
  avatarPreview.value = URL.createObjectURL(file)
}

const removeAvatar = () => {
  if (avatarPreview.value?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview.value)
  avatarFile.value = null
  avatarRemoved.value = !!profile.value.avatar
  avatarPreview.value = null
}

const saveProfile = async () => {
  saving.value = true
  errors.value = {}
  notice.value = null
  try {
    const changed = EDITABLE.filter(k => (form[k] ?? '') !== (profile.value[k] ?? ''))
    let body: any
    if (avatarFile.value) {
      // Multipart: send changed fields alongside the file
      body = new FormData()
      body.append('avatar', avatarFile.value)
      for (const k of changed) body.append(k, form[k] === null ? '' : String(form[k]))
    } else {
      body = Object.fromEntries(changed.map(k => [k, form[k]]))
      if (avatarRemoved.value) body.remove_avatar = true
    }
    profile.value = await api('/profiles/me/', { method: 'PATCH', body })
    resetForm()
    fetchUser() // keep sidebar name in sync
    notice.value = { type: 'success', text: 'Profile updated.' }
  } catch (err: any) {
    const data = err?.data
    if (data && typeof data === 'object') {
      errors.value = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, firstError(v)]))
      if (data.avatar) notice.value = { type: 'error', text: firstError(data.avatar) }
    }
    notice.value ??= { type: 'error', text: 'Some fields need attention. Please review and try again.' }
  } finally {
    saving.value = false
  }
}

const changePassword = async () => {
  pwSaving.value = true
  pwError.value = ''
  try {
    await api('/auth/change-password/', { method: 'POST', body: { ...pw } })
    pw.old_password = ''
    pw.new_password = ''
    notice.value = { type: 'success', text: 'Password updated.' }
  } catch (err: any) {
    const data = err?.data || {}
    pwError.value = data.error || (data.new_password && firstError(data.new_password)) || 'Could not update password.'
  } finally {
    pwSaving.value = false
  }
}
</script>

<style scoped>
.profile {
  /* Nigerian flag green theme */
  --primary: #008751;
  --primary-dark: #006b41;
  --primary-light: #e8f5ee;
  --primary-border: #b7dfc9;
  font-family: var(--font);
  min-width: 0;
  max-width: 960px;
}

.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

.profile-wrap, .profile-form { display: flex; flex-direction: column; gap: 1.5rem; }
.card { background: var(--cream); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem; box-shadow: var(--shadow-sm); }
.section-label { font-size: 1rem; font-weight: 700; color: var(--gray-900); margin-bottom: 1rem; }

/* Buttons */
.p-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; height: 44px; padding: 0 1.1rem; font: inherit; font-size: 0.9rem; font-weight: 600; border-radius: var(--radius-md); border: 1px solid transparent; cursor: pointer; text-decoration: none; transition: background 0.15s, border-color 0.15s; white-space: nowrap; }
.p-btn-sm { height: 36px; padding: 0 0.875rem; font-size: 0.82rem; }
.p-btn-primary { background: var(--primary); color: white; }
.p-btn-primary:hover:not(:disabled) { background: var(--primary-dark); }
.p-btn-outline { background: var(--cream); color: var(--primary); border-color: var(--primary); }
.p-btn-outline:hover:not(:disabled) { background: var(--primary-light); }
.p-btn-light { background: var(--cream); color: var(--primary); border-color: var(--primary); }
.p-btn-light:hover { background: #F3EBC0; }
.p-btn-ghost { background: rgba(255, 253, 243, 0.55); color: var(--gray-900); border-color: rgba(214, 160, 100, 0.35); }
.p-btn-ghost:hover { background: rgba(255, 253, 243, 0.85); }
.p-btn:focus-visible, .p-btn:focus-within { outline: 2px solid var(--primary-dark); outline-offset: 2px; }
.p-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
.p-btn-outline .spinner { border-color: rgba(0,135,81,0.3); border-top-color: var(--primary); }
@keyframes spin { to { transform: rotate(360deg); } }

/* Notice */
.notice { display: flex; align-items: flex-start; gap: 0.625rem; padding: 0.875rem 1rem; margin-bottom: 1.5rem; border-radius: var(--radius-md); font-size: 0.875rem; line-height: 1.45; border: 1px solid; }
.notice-text { flex: 1; }
.notice-success { background: var(--primary-light); border-color: var(--primary-border); color: var(--primary-dark); }
.notice-error { background: #fdf2f2; border-color: #f8b4b4; color: #9b1c1c; }
.notice-close { background: transparent; border: 0; color: inherit; cursor: pointer; padding: 2px; display: flex; opacity: 0.7; }
.notice-close:hover { opacity: 1; }

/* Hero */
.hero { background: linear-gradient(90deg, #9acca8 0%, #acd5b6 50%, #9acca8 100%); color: var(--gray-900); border-radius: var(--radius-lg); padding: 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; box-shadow: var(--shadow-sm); flex-wrap: wrap; }
/* Brand green glows at both edges with a warm amber glow between them, same as the landing CTA */
.hero { position: relative; isolation: isolate; overflow: hidden; }
.hero::before {
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
@media (prefers-reduced-motion: reduce) { .hero::before { animation: none; } }
.hero-left { display: flex; align-items: center; gap: 1rem; min-width: 0; }
.avatar { width: 76px; height: 76px; border-radius: 50%; background: rgba(255, 253, 243, 0.55); border: 3px solid rgba(251, 246, 218, 0.9); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800; flex-shrink: 0; overflow: hidden; }
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.hero-info { min-width: 0; }
.hero-name { font-size: 1.25rem; font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hero-meta { font-size: 0.9rem; color: var(--text-secondary); margin-top: 2px; }
.hero-since { display: flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px; }
.hero-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 0.75rem; }
.avatar-btns { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.plan-pill { padding: 0.3rem 0.9rem; font-size: 0.8rem; font-weight: 700; text-transform: capitalize; color: var(--primary); background: var(--cream); border-radius: 999px; }

/* Form */
.grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem 1.25rem; }
.field { display: flex; flex-direction: column; gap: 0.375rem; min-width: 0; }
.field-full { grid-column: 1 / -1; }
.field label { font-size: 0.82rem; font-weight: 600; color: var(--gray-700); }
.field .input { height: 44px; }
.field .textarea { height: auto; resize: vertical; min-height: 88px; line-height: 1.5; padding-top: 0.625rem; }
.input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(0,135,81,0.18); }
.field-hint { font-size: 0.75rem; color: var(--text-muted); }
.field-error { font-size: 0.78rem; color: #b91c1c; }

.toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; cursor: pointer; }
.toggle-title { font-weight: 600; color: var(--gray-900); font-size: 0.9rem; }
.toggle-sub { font-size: 0.82rem; color: var(--text-muted); }
.toggle { appearance: none; width: 44px; height: 24px; border-radius: 999px; background: var(--gray-300); position: relative; cursor: pointer; transition: background 0.15s; flex-shrink: 0; }
.toggle::after { content: ''; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: white; box-shadow: var(--shadow-sm); transition: transform 0.15s; }
.toggle:checked { background: var(--primary); }
.toggle:checked::after { transform: translateX(20px); }
.toggle:focus-visible { outline: 2px solid var(--primary-dark); outline-offset: 2px; }

.form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; }
.pw-actions { display: flex; justify-content: flex-end; }

/* Errors */
.error-card { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
.error-icon { width: 48px; height: 48px; border-radius: var(--radius-md); background: #fdf2f2; color: #b91c1c; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.error-text { flex: 1; min-width: 200px; }
.error-title { font-weight: 700; color: var(--gray-900); }
.error-sub { font-size: 0.85rem; color: var(--text-muted); }

/* Skeleton */
.sk { background: linear-gradient(90deg, #F3EBC0 25%, var(--cream) 50%, #F3EBC0 75%); background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite; border-radius: var(--radius-lg); }
@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
.sk-hero { height: 124px; }
.sk-card { height: 260px; }

/* ---------- Responsive ---------- */
@media (max-width: 600px) {
  .card, .hero { padding: 1.25rem; }
  .grid { grid-template-columns: 1fr; }
  .hero { flex-direction: column; align-items: flex-start; }
  .hero-actions { align-items: flex-start; }
  .avatar { width: 64px; height: 64px; font-size: 1.25rem; }
  .form-actions { flex-direction: column-reverse; }
  .form-actions .p-btn, .pw-actions .p-btn { width: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  .sk, .spinner { animation: none; }
  .toggle, .toggle::after { transition: none; }
}
</style>

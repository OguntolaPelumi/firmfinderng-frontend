<template>
  <div class="sidebar-root">

    <!-- Mobile menu button (shown only on small screens) -->
    <button
      v-if="!open"
      type="button"
      class="menu-fab"
      aria-label="Open menu"
      @click="open = true"
    >
      <Icon name="ph:list-bold" style="font-size:1.4rem" />
    </button>

    <!-- Backdrop (mobile drawer) -->
    <Transition name="fade">
      <div v-if="open" class="sidebar-backdrop" @click="open = false" />
    </Transition>

    <aside class="sidebar" :class="{ 'sidebar-open': open }" aria-label="Dashboard navigation">

      <!-- Logo -->
      <div class="sidebar-logo">
        <NuxtLink to="/dashboard" class="sidebar-logo-link" aria-label="FirmFinderNG dashboard">
          <div class="sidebar-logo-mark">
            <Icon name="ph:database-fill" style="font-size:1rem;color:var(--side-green)" />
          </div>
          <span class="sidebar-logo-text">FirmFinder<span class="sidebar-logo-accent">NG</span></span>
        </NuxtLink>
        <button type="button" class="sidebar-close" aria-label="Close menu" @click="open = false">
          <Icon name="ph:x-bold" style="font-size:1.1rem" />
        </button>
      </div>

      <!-- Nav -->
      <nav class="sidebar-nav">
        <p class="sidebar-nav-label">Main menu</p>
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="sidebar-link"
          :class="{ 'sidebar-link-active': isActive(item) }"
          :aria-current="isActive(item) ? 'page' : undefined"
        >
          <div class="sidebar-link-icon">
            <Icon :name="item.icon" style="font-size:1.05rem" />
          </div>
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <!-- Plan -->
      <div class="sidebar-plan">
        <div class="sidebar-plan-inner">
          <div class="sidebar-plan-top">
            <span class="sidebar-plan-label">{{ freeAccess ? 'Your access' : 'Current plan' }}</span>
            <span class="sidebar-plan-pill">{{ freeAccess ? 'Free' : user?.subscription_plan || 'free' }}</span>
          </div>
          <p v-if="leadsRemaining === null" class="sidebar-plan-usage">Unlimited leads and CSV export</p>
          <div v-else class="sidebar-plan-bar-wrap">
            <div
              class="sidebar-plan-bar"
              role="progressbar"
              :aria-valuenow="Math.round(usedPct)"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label="Leads used this month"
            >
              <div class="sidebar-plan-bar-fill" :style="{ width: usedPct + '%' }" />
            </div>
            <span class="sidebar-plan-usage">{{ leadsRemaining.toLocaleString() }} leads left</span>
          </div>
          <NuxtLink v-if="!freeAccess && paymentsEnabled && user?.subscription_plan === 'free'" to="/dashboard/billing" class="sidebar-upgrade-btn">
            Upgrade plan <Icon name="ph:arrow-right" />
          </NuxtLink>
        </div>
      </div>

      <!-- User -->
      <div class="sidebar-footer">
        <div class="sidebar-avatar" aria-hidden="true">{{ initials }}</div>
        <div class="sidebar-user-info">
          <p class="sidebar-user-name">{{ user?.full_name || 'User' }}</p>
        </div>
        <button type="button" class="sidebar-logout" @click="logout">
          <Icon name="ph:sign-out-bold" style="font-size:1rem" />
          <span>Log out</span>
        </button>
      </div>

    </aside>
  </div>
</template>

<script setup lang="ts">
const { user, logout, freeAccess, paymentsEnabled, leadsRemaining } = useAuth()
const route = useRoute()

// Shared state so a layout header button can also open the drawer: useState('sidebar-open')
const open = useState('sidebar-open', () => false)

const navItems = [
  { to: '/dashboard', icon: 'ph:squares-four-fill', label: 'Overview', exact: true },
  { to: '/dashboard/leads', icon: 'ph:buildings-fill', label: 'B2B Leads', exact: false },
  { to: '/dashboard/reports', icon: 'ph:chart-bar-fill', label: 'Market Reports', exact: false },
  // Billing is hidden during the free launch
  ...(freeAccess ? [] : [{ to: '/dashboard/billing', icon: 'ph:receipt-fill', label: 'Billing', exact: false }]),
  { to: '/dashboard/profile', icon: 'ph:user-circle-fill', label: 'My Profile', exact: false },
  { to: '/dashboard/support', icon: 'ph:lifebuoy-fill', label: 'Support', exact: false },
]

// "Overview" is only active on /dashboard itself, not on every /dashboard/* page
const isActive = (item: { to: string; exact: boolean }) => {
  const path = route.path.replace(/\/$/, '') || '/'
  return item.exact ? path === item.to : path === item.to || path.startsWith(item.to + '/')
}

const usedPct = computed(() => {
  const limit = user.value?.leads_limit || 20
  return Math.min(((user.value?.leads_used_this_month || 0) / limit) * 100, 100)
})

const initials = computed(() => {
  const name = user.value?.full_name || user.value?.email || 'U'
  return name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
})

// Close the drawer after navigating, and on Escape
watch(() => route.fullPath, () => { open.value = false })
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') open.value = false }
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.sidebar-root {
  /* Nigerian flag green theme */
  --primary: #008751;
  --primary-dark: #006b41;
  --primary-hover: #006b41;
  --primary-light: #e8f5ee;
  --primary-border: #b7dfc9;

  /* Two-tone sidebar: brand green panel (same as login) with sand text */
  --side-green: #00603a;
  --side-text: var(--sand);
  --side-hover: rgba(232, 226, 194, 0.12);
  --side-line: rgba(232, 226, 194, 0.18);
}

.sidebar {
  position: fixed; left: 0; top: 0; bottom: 0; width: 256px;
  background: linear-gradient(180deg, #00603a 0%, #006b41 100%);
  color: var(--side-text);
  display: flex; flex-direction: column; z-index: 100;
  box-shadow: var(--shadow-sm);
  font-family: var(--font);
}

/* Logo */
.sidebar-logo {
  display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
  padding: 1.25rem; border-bottom: 1px solid var(--side-line);
}
.sidebar-logo-link { display: flex; align-items: center; gap: 0.625rem; text-decoration: none; min-width: 0; }
.sidebar-logo-mark { width: 32px; height: 32px; border-radius: var(--radius); background: var(--side-text); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sidebar-logo-text { font-size: 1.1rem; font-weight: 800; color: var(--side-text); letter-spacing: -0.3px; }
.sidebar-logo-accent { color: var(--side-text); }
.sidebar-close { display: none; width: 36px; height: 36px; align-items: center; justify-content: center; background: none; border: 0; border-radius: var(--radius); color: var(--side-text); cursor: pointer; }
.sidebar-close:hover { background: var(--side-hover); }

/* Nav */
.sidebar-nav { flex: 1; padding: 1rem 0.75rem; overflow-y: auto; }
.sidebar-nav-label { font-size: 0.72rem; font-weight: 700; color: var(--side-text); letter-spacing: 0.06em; text-transform: uppercase; padding: 0 0.625rem; margin-bottom: 0.5rem; }
.sidebar-link {
  display: flex; align-items: center; gap: 0.625rem;
  min-height: 44px; padding: 0.4rem 0.625rem; border-radius: var(--radius);
  color: var(--side-text); text-decoration: none;
  font-size: 0.9rem; font-weight: 500;
  transition: background 0.15s, color 0.15s; margin-bottom: 2px;
}
.sidebar-link:hover { background: var(--side-hover); }
.sidebar-link:focus-visible { outline: 2px solid var(--side-text); outline-offset: -2px; }
/* Active link flips the two colors: sand pill with green text */
.sidebar-link-active, .sidebar-link-active:hover { background: var(--side-text); color: var(--side-green); font-weight: 700; }
.sidebar-link-icon { width: 30px; height: 30px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: inherit; }
.sidebar-link-active .sidebar-link-icon { background: var(--side-green); color: var(--side-text); }

/* Plan */
.sidebar-plan { padding: 0.75rem; border-top: 1px solid var(--side-line); }
.sidebar-plan-inner { background: var(--side-hover); border: 1px solid var(--side-line); border-radius: var(--radius-md); padding: 0.875rem; }
.sidebar-plan-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
.sidebar-plan-label { font-size: 0.75rem; font-weight: 600; color: var(--side-text); }
.sidebar-plan-pill { padding: 2px 10px; font-size: 0.72rem; font-weight: 700; text-transform: capitalize; color: var(--side-green); background: var(--side-text); border-radius: 999px; }
.sidebar-plan-bar-wrap { margin-bottom: 0.75rem; }
.sidebar-plan-bar { background: var(--side-line); border-radius: 999px; height: 8px; overflow: hidden; margin-bottom: 0.5rem; }
.sidebar-plan-bar-fill { height: 100%; background: var(--side-text); border-radius: 999px; transition: width 0.5s; }
.sidebar-plan-usage { font-size: 0.78rem; color: var(--side-text); }
.sidebar-plan-inner > .sidebar-plan-usage { display: block; }
.sidebar-upgrade-btn { display: flex; align-items: center; justify-content: center; gap: 0.4rem; min-height: 40px; background: var(--side-text); color: var(--side-green); padding: 0.5rem; border-radius: var(--radius); font-size: 0.85rem; font-weight: 600; text-decoration: none; transition: background 0.15s; }
.sidebar-upgrade-btn:hover { background: var(--cream); }
.sidebar-upgrade-btn:focus-visible { outline: 2px solid var(--side-text); outline-offset: 2px; }

/* Footer */
.sidebar-footer { display: flex; align-items: center; gap: 0.625rem; padding: 0.875rem 1rem; border-top: 1px solid var(--side-line); }
.sidebar-avatar { width: 34px; height: 34px; border-radius: 50%; background: var(--side-text); color: var(--side-green); font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sidebar-user-info { flex: 1; overflow: hidden; min-width: 0; }
.sidebar-user-name { font-size: 0.82rem; font-weight: 600; color: var(--side-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sidebar-logout {
  display: inline-flex; align-items: center; gap: 0.35rem; flex-shrink: 0;
  height: 36px; padding: 0 0.75rem; border-radius: 999px;
  font: inherit; font-size: 0.8rem; font-weight: 600; color: var(--side-text);
  background: var(--side-hover); border: 1px solid var(--side-line); cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.sidebar-logout:hover { background: var(--side-text); color: var(--side-green); }
.sidebar-logout:focus-visible { outline: 2px solid var(--side-text); outline-offset: 1px; }

/* Mobile menu button + backdrop (hidden on desktop) */
.menu-fab { display: none; }
.sidebar-backdrop { display: none; }

/* ---------- Tablet & mobile: sidebar becomes a slide-in drawer ---------- */
@media (max-width: 1024px) {
  .sidebar { transform: translateX(-100%); transition: transform 0.25s ease; width: min(300px, 85vw); box-shadow: none; z-index: 210; }
  .sidebar-open { transform: translateX(0); box-shadow: var(--shadow-lg); }
  .sidebar-close { display: flex; }

  .sidebar-backdrop { display: block; position: fixed; inset: 0; background: rgba(0, 40, 24, 0.45); z-index: 200; }

  .menu-fab {
    display: flex; align-items: center; justify-content: center;
    position: fixed; left: 1rem; bottom: calc(1rem + env(safe-area-inset-bottom, 0px)); z-index: 90;
    width: 52px; height: 52px; border-radius: 50%;
    background: var(--side-green); color: var(--side-text); border: 0; cursor: pointer;
    box-shadow: 0 4px 14px rgba(0, 107, 65, 0.4);
  }
  .menu-fab:hover { background: #006b41; }
  .menu-fab:focus-visible { outline: 2px solid var(--primary-dark); outline-offset: 3px; }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .sidebar { transition: none; }
  .fade-enter-active, .fade-leave-active { transition: none; }
  .sidebar-plan-bar-fill { transition: none; }
}
</style>

<template>
  <div class="dashboard-layout">
    <AppSidebar />
    <div class="dashboard-main">

      <!-- Top header -->
      <header class="dash-header" :class="{ scrolled }">
        <div class="dash-header-inner">
          <div class="dash-header-left">
            <h1 class="dash-title">{{ title }}</h1>
            <p v-if="subtitle" class="dash-subtitle">{{ subtitle }}</p>
          </div>
          <div class="dash-header-right">
            <div class="dash-leads-pill">
              <div class="dash-leads-dot" />
              <span>{{ user?.leads_remaining ?? 0 }} leads remaining</span>
            </div>
            <NuxtLink v-if="user?.subscription_plan === 'free'" to="/dashboard/billing" class="btn btn-primary btn-sm">
              Upgrade Plan
            </NuxtLink>
          </div>
        </div>
      </header>

      <!-- Page content -->
      <div class="dashboard-content">
        <slot />
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title?: string; subtitle?: string }>()
const { user, fetchUser } = useAuth()

// Header blends into the page at the top and gets its warm animated background once scrolled
const scrolled = ref(false)
const onScroll = () => { scrolled.value = window.scrollY > 8 }

onMounted(() => {
  fetchUser()
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
.dash-header {
  background: transparent; border-bottom: 1px solid transparent;
  position: sticky; top: 0; z-index: 50; isolation: isolate;
  transition: box-shadow 0.35s ease, border-color 0.35s ease;
}
/* Same flowing green/amber band as the landing nav, faded in once the page scrolls */
.dash-header::before {
  content: ''; position: absolute; inset: 0; z-index: -1; opacity: 0; transition: opacity 0.35s ease;
  background: linear-gradient(100deg, #c2e3cf 0%, #f6dcb4 22%, #cfe8d8 45%, #f3cfa6 68%, #c2e3cf 85%, #f6dcb4 100%);
  background-size: 300% 100%;
  animation: nav-flow 18s linear infinite;
}
.dash-header.scrolled { backdrop-filter: blur(12px); border-bottom-color: rgba(214, 160, 100, 0.25); box-shadow: 0 8px 24px -12px rgba(170, 110, 50, 0.35); }
.dash-header.scrolled::before { opacity: 0.94; }
@keyframes nav-flow { from { background-position: 0% 50%; } to { background-position: 300% 50%; } }
.dash-header-inner {
  padding: 0.875rem 2rem;
  display: flex; align-items: center; justify-content: space-between;
  gap: 1rem;
}
.dash-title { font-size: 1.125rem; font-weight: 700; color: var(--gray-900); }
.dash-subtitle { font-size: 0.8rem; color: var(--text-muted); margin-top: 1px; }
.dash-header-right { display: flex; align-items: center; gap: 0.75rem; }
.dash-leads-pill {
  display: flex; align-items: center; gap: 0.375rem;
  background: rgba(255, 253, 243, 0.55); border: 1px solid rgba(214, 160, 100, 0.35);
  backdrop-filter: blur(8px);
  padding: 0.375rem 0.75rem; border-radius: 999px;
  font-size: 0.8rem; font-weight: 500; color: var(--gray-600);
}
.dash-leads-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--success); flex-shrink: 0;
}

@media (prefers-reduced-motion: reduce) {
  .dash-header::before { animation: none; }
}
</style>

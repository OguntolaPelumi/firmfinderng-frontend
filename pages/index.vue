<template>
  <div class="landing">

    <!-- Nav -->
    <nav class="nav" :class="{ scrolled: scrolled || menuOpen }" aria-label="Main navigation">
      <div class="nav-inner">
        <div class="nav-logo">
          <div class="nav-logo-mark">
            <Icon name="ph:database-fill" style="font-size:0.875rem;color:white" />
          </div>
          <span class="nav-logo-text">FirmFinder<span class="nav-logo-accent">NG</span></span>
        </div>

        <button
          class="nav-toggle"
          type="button"
          :aria-expanded="menuOpen"
          aria-controls="nav-links"
          aria-label="Toggle menu"
          @click="menuOpen = !menuOpen"
        >
          <Icon :name="menuOpen ? 'ph:x' : 'ph:list'" style="font-size:1.25rem" />
        </button>

        <div id="nav-links" class="nav-links" :class="{ open: menuOpen }">
          <a href="#features" class="nav-link" @click="closeMenu">Features</a>
          <a href="#pricing" class="nav-link" @click="closeMenu">Pricing</a>
          <NuxtLink to="/login" class="nav-link" @click="closeMenu">Sign In</NuxtLink>
          <NuxtLink to="/register" class="btn btn-primary btn-sm nav-cta" @click="closeMenu">Get Started Free</NuxtLink>
        </div>
      </div>
    </nav>

    <!-- Hero -->
    <section class="hero">
      <div class="hero-inner">
        <h1 class="hero-title">
          Find verified Nigerian leads.<br class="hero-br" />
          <span class="hero-title-accent">Export in one click.</span>
        </h1>
        <p class="hero-sub">
          Access verified B2B leads, competitor intelligence, and market reports
          for Nigerian businesses updated weekly, exportable instantly.
        </p>
        <div class="hero-actions">
          <NuxtLink to="/register" class="btn btn-primary btn-lg">
            Start Free
          </NuxtLink>
          <NuxtLink to="/login" class="btn btn-secondary btn-lg">Sign In →</NuxtLink>
        </div>
        <div class="hero-stats">
          <div v-for="(stat, i) in stats" :key="stat.label" class="hero-stat" :style="{ '--i': i }">
            <span class="hero-stat-val">{{ stat.val }}</span>
            <span class="hero-stat-label">{{ stat.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section id="features" class="section section-alt">
      <div class="section-inner">
        <div class="section-header">
          <p class="section-eyebrow">Features</p>
          <h2 class="section-title">Everything your business needs</h2>
          <p class="section-sub">Four powerful tools in one platform</p>
        </div>
        <div class="features-grid">
          <div v-for="f in features" :key="f.title" class="feature-card">
            <div class="feature-icon">
              <Icon :name="f.icon" style="font-size:1.25rem" />
            </div>
            <h3 class="feature-title">{{ f.title }}</h3>
            <p class="feature-desc">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing -->
    <section id="pricing" class="section">
      <div class="section-inner">
        <div class="section-header">
          <p class="section-eyebrow">Pricing</p>
          <h2 class="section-title">{{ freeAccess ? 'Free while we launch' : 'Simple, transparent pricing' }}</h2>
          <p class="section-sub">{{ freeAccess ? 'Every feature is unlocked for every account. No card, no catch.' : 'Start free. Upgrade when you are ready.' }}</p>
        </div>
        <div class="pricing-grid" :class="{ 'pricing-grid-single': freeAccess }">
          <div v-for="plan in shownPlans" :key="plan.name"
            class="pricing-card"
            :class="plan.featured ? 'pricing-card-featured' : ''">
            <div v-if="plan.featured" class="pricing-popular">Most Popular</div>
            <p class="pricing-name">{{ plan.name }}</p>
            <div class="pricing-price">
              <span class="pricing-amount">{{ plan.price }}</span>
              <span class="pricing-period">{{ plan.period }}</span>
            </div>
            <p class="pricing-desc">{{ plan.desc }}</p>
            <ul class="pricing-features">
              <li v-for="f in plan.features" :key="f">
                <Icon name="ph:check-circle-fill" style="color:var(--primary);font-size:0.875rem;flex-shrink:0;margin-top:2px" />
                <span>{{ f }}</span>
              </li>
            </ul>
            <NuxtLink to="/register"
              class="btn btn-lg pricing-btn"
              :class="plan.featured ? 'btn-primary' : 'btn-outline'">
              {{ plan.cta }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-section">
      <div class="cta-inner">
        <h2 class="cta-title">Ready to find your next Nigerian client?</h2>
        <p class="cta-sub">Join businesses already using FirmFinderNG to grow smarter.</p>
        <NuxtLink to="/register" class="btn btn-primary btn-lg cta-btn">
          Get Started Free Today
        </NuxtLink>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <div class="nav-logo-mark" style="width:24px;height:24px">
            <Icon name="ph:database-fill" style="font-size:0.75rem;color:white" />
          </div>
          <span style="font-weight:700;color:var(--gray-700)">
            FirmFinder<span style="color:var(--text-accent)">NG</span>
          </span>
        </div>
        <div class="footer-links">
          <NuxtLink to="/login">Sign In</NuxtLink>
          <NuxtLink to="/register">Register</NuxtLink>
        </div>
      </div>
    </footer>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'guest' })

const menuOpen = ref(false)
const closeMenu = () => { menuOpen.value = false }

// Nav blends into the hero at the top and gets its own background once scrolled
const scrolled = ref(false)
const onScroll = () => { scrolled.value = window.scrollY > 24 }

// Close the mobile menu if the viewport grows past the mobile breakpoint
onMounted(() => {
  const mq = window.matchMedia('(min-width: 769px)')
  const handler = (e: MediaQueryListEvent) => { if (e.matches) menuOpen.value = false }
  mq.addEventListener('change', handler)
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  onBeforeUnmount(() => {
    mq.removeEventListener('change', handler)
    window.removeEventListener('scroll', onScroll)
  })
})

const stats = [
  { val: '10,000+', label: 'Verified Businesses' },
  { val: '36', label: 'Nigerian States' },
  { val: '20+', label: 'Industries' },
  { val: 'Weekly', label: 'Data Updates' },
]

const features = [
  { icon: 'ph:buildings-fill', title: 'B2B Lead Database', desc: 'Thousands of verified Nigerian businesses filtered by industry, state, and city. Export to CSV instantly.' },
  { icon: 'ph:magnifying-glass-fill', title: 'Competitor Intelligence', desc: 'Track competitor pricing and monitor market movements across industries in real time.' },
  { icon: 'ph:chart-bar-fill', title: 'Market Reports', desc: 'Weekly intelligence reports on Nigerian market trends, industry analysis, and growth opportunities.' },
  { icon: 'ph:export-fill', title: 'Instant Export', desc: 'Download filtered leads as CSV or Excel with one click. Ready for your CRM immediately.' },
]

const { freeAccess } = useAuth()

const launchPlan = {
  name: 'Free access', price: '₦0', period: '/month', desc: 'Full access while FirmFinderNG is in launch', featured: true, cta: 'Create free account',
  features: ['Full contact details: phone, email, website', 'CSV export of any search', 'All industries and states', 'All market reports'],
}

const plans = [
  { name: 'Free', price: '₦0', period: '/month', desc: 'Get started with limited access', featured: false, cta: 'Start Free', features: ['20 lead previews/month', 'Basic search and filter', 'CSV export', 'Community support'] },
  { name: 'Basic', price: '₦15,000', period: '/month', desc: 'For growing businesses', featured: false, cta: 'Get Basic', features: ['500 full leads/month', 'CSV export', '1 industry filter', 'Email support'] },
  { name: 'Pro', price: '₦35,000', period: '/month', desc: 'For serious lead generation', featured: true, cta: 'Get Pro', features: ['2,000 leads/month', 'Excel + CSV export', 'All industries', 'Competitor tracking', 'Market reports', 'Priority support'] },
  { name: 'Enterprise', price: '₦80,000', period: '/month', desc: 'For agencies and large teams', featured: false, cta: 'Get Enterprise', features: ['Unlimited leads', 'API access', 'Weekly reports', 'All Pro features', 'Dedicated support'] },
]

const shownPlans = computed(() => freeAccess ? [launchPlan] : plans)
</script>

<style scoped>
.landing {
  /* Nigerian flag green theme (overrides global blue tokens for this page) */
  --primary: #008751;
  --primary-dark: #006b41;
  --primary-hover: #006b41;
  --primary-light: #e8f5ee;
  --primary-border: #b7dfc9;
  --cream: #FBF6DA;
  --sand: #e8e2c2;

  background-color: var(--sand);
  color: var(--text);
  font-family: var(--font);
  overflow-x: hidden;
  -webkit-text-size-adjust: 100%;
}

/* Anchor links shouldn't hide under the fixed nav */
#features, #pricing { scroll-margin-top: 4.5rem; }

/* Nav */
.nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: rgba(255,255,255,0.95); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); }
.nav-inner { max-width: 1200px; margin: 0 auto; padding: 0.875rem 2rem; display: flex; align-items: center; justify-content: space-between; }
.nav-logo { display: flex; align-items: center; gap: 0.5rem; }
.nav-logo-mark { width: 28px; height: 28px; border-radius: var(--radius); background: var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.nav-logo-text { font-size: 1.05rem; font-weight: 800; color: var(--gray-900); }
.nav-logo-accent { color: var(--text-accent); }
.nav-links { display: flex; align-items: center; gap: 0.25rem; }
.nav-link { padding: 0.5rem 0.875rem; color: var(--gray-600); text-decoration: none; font-size: 0.875rem; font-weight: 500; border-radius: var(--radius); transition: all 0.15s; }
.nav-link:hover { background: var(--gray-100); color: var(--gray-900); }

/* Mobile menu toggle (hidden on desktop) */
.nav-toggle { display: none; align-items: center; justify-content: center; width: 42px; height: 42px; background: rgba(255, 253, 243, 0.55); border: 1px solid rgba(214, 160, 100, 0.35); border-radius: var(--radius-md); color: var(--gray-900); cursor: pointer; backdrop-filter: blur(8px); }
.nav-toggle:hover { background: rgba(255, 253, 243, 0.85); }
.nav-toggle:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

/* Hero */
/* Green at the top, fading to sand so it flows into the rest of the page */
.hero { padding: 8rem 2rem 5rem; text-align: center; background: linear-gradient(180deg, #c2e3cf 0%, #d4e6cc 55%, var(--sand) 100%); }
.hero-inner { max-width: 720px; margin: 0 auto; }
.hero-title-accent { color: var(--text-accent); }
.hero-title { font-size: clamp(2rem, 6vw + 0.5rem, 3.75rem); font-weight: 800; color: var(--gray-900); line-height: 1.1; letter-spacing: -0.02em; margin-bottom: 1.25rem; overflow-wrap: break-word; }
.hero-sub { font-size: 1.1rem; color: var(--text-secondary); max-width: 540px; margin: 0 auto 2.5rem; line-height: 1.7; }
.hero-actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; margin-bottom: 3rem; }
.hero-stats { display: flex; justify-content: center; gap: 3rem; flex-wrap: wrap; padding-top: 2.5rem; border-top: 1px solid var(--border); }
.hero-stat { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; }
/* Presentation-style loop: stats slide in one after another, hold together, then slide out and repeat */
.hero-stat { opacity: 0; animation: stat-loop 10s cubic-bezier(0.2, 0.7, 0.2, 1) infinite; animation-delay: calc(0.4s + var(--i) * 0.3s); }
@keyframes stat-loop {
  0%   { opacity: 0; transform: translateY(16px); }
  6%   { opacity: 1; transform: none; }
  84%  { opacity: 1; transform: none; }
  90%  { opacity: 0; transform: translateY(-16px); }
  100% { opacity: 0; transform: translateY(-16px); }
}
@keyframes stat-loop-left {
  0%   { opacity: 0; transform: translateX(-32px); }
  6%   { opacity: 1; transform: none; }
  84%  { opacity: 1; transform: none; }
  90%  { opacity: 0; transform: translateX(-32px); }
  100% { opacity: 0; transform: translateX(-32px); }
}
.hero-stat-val { font-size: 1.5rem; font-weight: 800; color: var(--text-accent); }
.hero-stat-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }

/* Sections */
.section { padding: 5rem 2rem; }
.section-alt { background: var(--sand); }
.section-inner { max-width: 1100px; margin: 0 auto; }
.section-header { text-align: center; margin-bottom: 3rem; }
.section-eyebrow { font-size: 0.8rem; font-weight: 700; color: var(--text-accent); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem; }
.section-title { font-size: clamp(1.5rem, 4vw + 0.5rem, 2.5rem); font-weight: 800; color: var(--gray-900); margin-bottom: 0.75rem; letter-spacing: -0.01em; }
.section-sub { color: var(--text-secondary); font-size: 1rem; }

/* Features: 4 cols desktop, 2 tablet, 1 mobile */
.features-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; }
.feature-card { background: var(--cream); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 1.75rem; transition: all 0.2s; }
.feature-card:hover { box-shadow: var(--shadow-md); border-color: var(--primary-border); transform: translateY(-2px); }
.feature-icon { width: 44px; height: 44px; background: var(--primary-light); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; color: var(--primary); margin-bottom: 1rem; }
.feature-title { font-size: 0.9rem; font-weight: 700; color: var(--gray-900); margin-bottom: 0.5rem; }
.feature-desc { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; }

/* Pricing: 4 cols desktop, 2 tablet, 1 mobile */
.pricing-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; max-width: 1000px; margin: 0 auto; }
.pricing-card { background: var(--cream); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 1.75rem; position: relative; transition: all 0.2s; display: flex; flex-direction: column; }
.pricing-card:hover { box-shadow: var(--shadow-md); }
.pricing-grid.pricing-grid-single { grid-template-columns: minmax(0, 400px); justify-content: center; }
.pricing-card-featured { border-color: var(--primary); box-shadow: 0 0 0 1px var(--primary), var(--shadow-md); }
.pricing-popular { position: absolute; top: -13px; left: 50%; transform: translateX(-50%); background: var(--primary); color: white; font-size: 0.7rem; font-weight: 700; padding: 3px 14px; border-radius: 999px; white-space: nowrap; letter-spacing: 0.02em; }
.pricing-name { font-size: 0.875rem; font-weight: 700; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.875rem; }
.pricing-price { display: flex; align-items: baseline; flex-wrap: wrap; gap: 2px; margin-bottom: 0.5rem; }
.pricing-amount { font-size: 1.875rem; font-weight: 800; color: var(--gray-900); }
.pricing-period { font-size: 0.85rem; color: var(--text-muted); }
.pricing-desc { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.25rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--border); }
.pricing-features { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.625rem; flex: 1; }
.pricing-features li { display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.825rem; color: var(--gray-700); }
.pricing-btn { width: 100%; justify-content: center; margin-top: 1.5rem; }

/* CTA */
.cta-section {
  padding: 5rem 2rem; text-align: center;
  position: relative; isolation: isolate; overflow: hidden;
  /* Mostly even green with only a slight lift in the centre */
  background: linear-gradient(90deg, #9acca8 0%, #acd5b6 50%, #9acca8 100%);
}
/* Brand green glows at both edges with a warm amber glow between them, drifting like the hero */
.cta-section::before {
  content: ''; position: absolute; inset: -15% -10%; z-index: -1; pointer-events: none;
  background:
    radial-gradient(45% 90% at 8% 40%, rgba(0, 135, 81, 0.5), transparent 75%),
    radial-gradient(45% 90% at 92% 60%, rgba(0, 135, 81, 0.5), transparent 75%),
    radial-gradient(26% 50% at 50% 70%, rgba(255, 170, 90, 0.22), transparent 72%);
  filter: blur(24px);
  animation: warm-drift 14s ease-in-out infinite alternate;
}
.cta-inner { max-width: 600px; margin: 0 auto; }
.cta-title { font-size: clamp(1.4rem, 4vw + 0.25rem, 2.25rem); font-weight: 800; color: var(--gray-900); margin-bottom: 0.75rem; letter-spacing: -0.01em; }
.cta-sub { color: var(--text-secondary); margin-bottom: 2rem; font-size: 1rem; }
.landing :deep(.btn-primary) { background: var(--primary); border-color: var(--primary); color: white; }
.landing :deep(.btn-primary:hover) { background: var(--primary-dark); border-color: var(--primary-dark); }
/* Hero Sign In: soft, see-through cream that blends into the hero instead of a flat block */
.hero-actions .btn-secondary {
  background: linear-gradient(180deg, rgba(255, 253, 243, 0.75) 0%, rgba(251, 246, 218, 0.6) 100%);
  border: 1px solid rgba(251, 246, 218, 0.9);
  color: var(--gray-900);
  backdrop-filter: blur(8px);
  box-shadow: 0 6px 18px -10px rgba(170, 120, 60, 0.35);
  transition: background 0.2s ease, box-shadow 0.2s ease;
}
.hero-actions .btn-secondary:hover {
  background: linear-gradient(180deg, rgba(255, 253, 243, 0.9) 0%, rgba(251, 246, 218, 0.8) 100%);
  box-shadow: 0 8px 22px -10px rgba(170, 120, 60, 0.45);
}
.landing :deep(.btn-outline) { color: var(--primary); border-color: var(--primary); }
.landing :deep(.btn-outline:hover) { background: var(--primary-light); }
.cta-section .btn-primary { background: var(--cream); color: var(--primary); border-color: var(--primary); }
.cta-section .btn-primary:hover { background: #F3EBC0; }

/* Footer */
.footer { padding: 1.5rem 2rem; border-top: 1px solid var(--border); background: var(--cream); }
.footer-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.footer-brand { display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem; }
.footer-links { display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; }
.footer-links a { font-size: 0.8rem; color: var(--text-muted); text-decoration: none; }
.footer-links a:hover { color: var(--primary); }

/* ---------- Nav (all screens): larger, warm animated background blended into hero ---------- */
  #features, #pricing { scroll-margin-top: 5.5rem; }

  /* At the top the nav is see-through, so the hero's warm glow shows behind it */
  .nav { background: transparent; backdrop-filter: none; border-bottom-color: transparent; transition: box-shadow 0.35s ease, border-color 0.35s ease; }
  .nav::before {
    content: ''; position: absolute; inset: 0; z-index: -1; opacity: 0; transition: opacity 0.35s ease;
    background: linear-gradient(100deg, #c2e3cf 0%, #f6dcb4 22%, #cfe8d8 45%, #f3cfa6 68%, #c2e3cf 85%, #f6dcb4 100%);
    background-size: 300% 100%;
    animation: nav-flow 18s linear infinite;
  }
  .nav.scrolled { backdrop-filter: blur(12px); border-bottom-color: rgba(214, 160, 100, 0.25); box-shadow: 0 8px 24px -12px rgba(170, 110, 50, 0.35); }
  .nav.scrolled::before { opacity: 0.94; }

  .nav-inner { max-width: 1280px; padding: 1.25rem 2.5rem; }
  .nav-logo { gap: 0.625rem; }
  .nav-logo-mark { width: 38px; height: 38px; border-radius: var(--radius-md); box-shadow: 0 4px 12px -4px rgba(0, 135, 81, 0.5); }
  .nav-logo-mark > * { font-size: 1.1rem !important; }
  .nav-logo-text { font-size: 1.35rem; letter-spacing: -0.3px; }
  .nav-links { gap: 0.5rem; }
  .nav-link { padding: 0.625rem 1.125rem; font-size: 0.975rem; color: var(--gray-700); }
  .nav-link:hover { background: rgba(255, 255, 255, 0.55); color: var(--gray-900); }
  .nav-cta { padding: 0.7rem 1.4rem; font-size: 0.95rem; box-shadow: 0 6px 16px -6px rgba(0, 135, 81, 0.55); }

  /* Warm glow drifting across the top of the hero, sitting behind the nav */
  .hero { position: relative; isolation: isolate; overflow: hidden; }
  .hero::before {
    content: ''; position: absolute; left: -10%; right: -10%; top: -25%; height: 125%; z-index: -1; pointer-events: none;
    background:
      radial-gradient(32% 40% at 22% 25%, rgba(255, 180, 100, 0.68), transparent 70%),
      radial-gradient(28% 36% at 78% 18%, rgba(255, 140, 95, 0.5), transparent 70%),
      radial-gradient(42% 40% at 50% 4%, rgba(255, 210, 140, 0.72), transparent 72%),
      radial-gradient(38% 34% at 30% 75%, rgba(255, 196, 120, 0.4), transparent 72%),
      radial-gradient(34% 32% at 75% 82%, rgba(255, 165, 110, 0.32), transparent 72%);
    filter: blur(24px);
    animation: warm-drift 14s ease-in-out infinite alternate;
  }
/* Wide screens: stats dock to the left edge of the hero as a vertical rail */
@media (min-width: 1200px) {
  .hero { position: relative; }
  .hero-stats {
    position: absolute; left: 2.5rem; top: 50%; transform: translateY(-50%);
    flex-direction: column; align-items: flex-start; gap: 1.75rem;
    padding: 0.5rem 0 0.5rem 1.25rem; border-top: none; border-left: 2px solid var(--primary-border);
  }
  .hero-stat { align-items: flex-start; text-align: left; animation-name: stat-loop-left; }
  .hero-actions { margin-bottom: 0; }
}

@keyframes nav-flow { from { background-position: 0% 50%; } to { background-position: 300% 50%; } }
@keyframes warm-drift {
  0%   { transform: translate3d(-4%, 0, 0) scale(1); }
  50%  { transform: translate3d(3%, 4%, 0) scale(1.08); }
  100% { transform: translate3d(5%, -2%, 0) scale(1.02); }
}

/* Hover lift only on devices that can actually hover (avoids sticky hover on touch) */
@media (hover: none) {
  .feature-card:hover { transform: none; box-shadow: none; border-color: var(--border); }
  .pricing-card:hover { box-shadow: none; }
  .pricing-card-featured:hover { box-shadow: 0 0 0 1px var(--primary), var(--shadow-md); }
}

/* ---------- Large tablets / small laptops ---------- */
@media (max-width: 1024px) {
  .hero-stats { gap: 2rem; }
  .features-grid { grid-template-columns: repeat(2, 1fr); }
  .pricing-grid { grid-template-columns: repeat(2, 1fr); max-width: 640px; row-gap: 1.75rem; }
}

/* ---------- Tablets & mobile: collapsible nav ---------- */
@media (max-width: 768px) {
  .nav-inner { padding: 1rem 1.25rem; }
  .nav-toggle { display: inline-flex; }
  .nav-logo-mark { width: 34px; height: 34px; }
  .nav-logo-mark > * { font-size: 1rem !important; }
  .nav-logo-text { font-size: 1.2rem; }

  .nav-links {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: stretch;
    gap: 0.25rem;
    padding: 0.75rem 1.25rem 1.25rem;
    /* Warm cream panel that matches the scrolled nav */
    background: rgba(251, 246, 218, 0.97);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(214, 160, 100, 0.25);
    box-shadow: 0 12px 24px -12px rgba(170, 110, 50, 0.35);
  }
  .nav-links.open { display: flex; }
  .nav-link { padding: 0.75rem 0.875rem; font-size: 0.95rem; }
  .nav-cta { width: 100%; justify-content: center; margin-top: 0.5rem; padding-top: 0.75rem; padding-bottom: 0.75rem; }

  .hero { padding: 6.5rem 1.25rem 3.5rem; }
  .hero-sub { font-size: 1rem; margin-bottom: 2rem; }
  .hero-actions { margin-bottom: 2.25rem; }
  .hero-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem 1rem; padding-top: 2rem; }

  .section { padding: 3.5rem 1.25rem; }
  .section-header { margin-bottom: 2.25rem; }

  .cta-section { padding: 3.5rem 1.25rem; }
  .footer { padding: 1.5rem 1.25rem; }
}

/* ---------- Mobile ---------- */
@media (max-width: 600px) {
  /* Let the heading wrap naturally on narrow screens */
  .hero-br { display: none; }

  /* Full-width, thumb-friendly buttons */
  .hero-actions { flex-direction: column; align-items: stretch; }
  .hero-actions .btn { width: 100%; justify-content: center; }
  .cta-btn { width: 100%; justify-content: center; }

  .features-grid { grid-template-columns: 1fr; gap: 1rem; }
  .feature-card { padding: 1.5rem; }

  .pricing-grid { grid-template-columns: 1fr; max-width: 420px; row-gap: 1.75rem; }
  .pricing-card { padding: 1.5rem; }

  .footer-inner { flex-direction: column; align-items: flex-start; }
}

/* ---------- Very small phones ---------- */
@media (max-width: 380px) {
  .nav-inner { padding: 0.75rem 1rem; }
  .hero { padding-left: 1rem; padding-right: 1rem; }
  .section, .cta-section, .footer { padding-left: 1rem; padding-right: 1rem; }
  .hero-stat-val { font-size: 1.25rem; }
  .pricing-amount { font-size: 1.625rem; }
}

/* Respect reduced-motion preferences */
@media (prefers-reduced-motion: reduce) {
  .nav::before, .hero::before, .cta-section::before { animation: none; }
  .hero-stat { animation: none; opacity: 1; }
  .feature-card, .pricing-card, .nav-link { transition: none; }
}
</style>

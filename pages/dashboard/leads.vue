<template>
  <NuxtLayout name="dashboard" title="B2B Leads" subtitle="Search and export verified Nigerian business contacts">
    <div class="leads">

      <!-- Notice (replaces browser alerts) -->
      <div v-if="notice" class="notice" role="status">
        <Icon name="ph:warning-circle-fill" style="font-size:1.1rem;flex-shrink:0" />
        <span class="notice-text">{{ notice }}</span>
        <button type="button" class="notice-close" aria-label="Dismiss" @click="notice = ''">
          <Icon name="ph:x" />
        </button>
      </div>

      <!-- Filters -->
      <div class="filters-card">
        <div class="filters-row">
          <div class="filter-search-wrap">
            <Icon name="ph:magnifying-glass-bold" class="filter-search-icon" />
            <input
              v-model="search"
              type="search"
              class="f-input filter-search"
              placeholder="Search by name, city, description..."
              aria-label="Search leads"
              @input="debouncedFetch"
            />
          </div>

          <select v-model="selectedIndustry" class="f-input f-select" aria-label="Industry" @change="fetchLeads">
            <option value="">All industries</option>
            <option v-for="ind in industries" :key="ind.id" :value="ind.slug">{{ ind.name }}</option>
          </select>
          <select v-model="selectedState" class="f-input f-select" aria-label="State" @change="fetchLeads">
            <option value="">All states</option>
            <option v-for="s in states" :key="s.id" :value="s.slug">{{ s.name }}</option>
          </select>
          <select v-model="hasEmail" class="f-input f-select" aria-label="Contact type" @change="fetchLeads">
            <option value="">Any contact</option>
            <option value="true">Has email</option>
          </select>

          <!-- Accounts without export get sent to upgrade instead of a failing button -->
          <NuxtLink v-if="isFree" to="/dashboard/billing" class="l-btn l-btn-outline export-btn">
            <Icon name="ph:lock-simple-fill" /> Export CSV
          </NuxtLink>
          <button v-else type="button" class="l-btn l-btn-primary export-btn" :disabled="exporting" @click="exportLeads">
            <span v-if="exporting" class="spinner" aria-hidden="true" />
            <Icon v-else name="ph:export-fill" />
            {{ exporting ? 'Exporting...' : selected.size ? `Export ${selected.size} selected` : 'Export CSV' }}
          </button>
        </div>

        <div v-if="hasFilters" class="filters-active">
          <span>Filters applied</span>
          <button type="button" class="link-btn" @click="clearFilters">Clear all</button>
        </div>
      </div>

      <!-- Free tier banner -->
      <div v-if="isFree" class="upgrade-banner">
        <Icon name="ph:lock-simple-fill" style="flex-shrink:0;font-size:1.1rem" />
        <span class="upgrade-text">Free plan shows previews only. Phone, email and website are hidden.</span>
        <NuxtLink to="/dashboard/billing" class="upgrade-action">Upgrade to unlock <Icon name="ph:arrow-right" /></NuxtLink>
      </div>

      <!-- Results -->
      <div ref="tableCard" class="table-card">

        <div v-if="loading" class="table-state" aria-busy="true" aria-live="polite">
          <span class="spinner spinner-green" aria-hidden="true" />
          Loading leads...
        </div>

        <div v-else-if="error" class="table-state table-error" role="alert">
          <Icon name="ph:warning-circle-fill" style="font-size:1.75rem" />
          <p>{{ error }}</p>
          <button type="button" class="l-btn l-btn-primary" @click="fetchLeads">
            <Icon name="ph:arrow-clockwise" /> Try again
          </button>
        </div>

        <template v-else>
          <div class="table-toolbar">
            <span class="table-count">
              <template v-if="leads.length">Showing {{ rangeStart }}–{{ rangeEnd }} of {{ count.toLocaleString() }} businesses</template>
              <template v-else>0 businesses found</template>
            </span>
            <div v-if="selected.size" class="selection-bar" role="status">
              <span class="selection-count"><Icon name="ph:check-square-fill" /> {{ selected.size }} selected</span>
              <button type="button" class="link-btn" @click="clearSelection">Clear</button>
            </div>
            <span v-else-if="!isFree && leads.length" class="table-hint">Tick businesses to export just those, or click one for details</span>
          </div>

          <div v-if="!leads.length" class="empty-state">
            <div class="empty-icon"><Icon name="ph:magnifying-glass-bold" style="font-size:1.4rem" /></div>
            <p class="empty-title">No businesses found</p>
            <p class="empty-sub">Try a different search or adjust your filters.</p>
            <button v-if="hasFilters" type="button" class="l-btn l-btn-outline" @click="clearFilters">Clear filters</button>
          </div>

          <div v-else class="table-scroll">
            <table class="leads-table">
              <thead>
                <tr>
                  <th v-if="!isFree" class="cell-check">
                    <input
                      type="checkbox"
                      class="row-check"
                      :checked="pageAllSelected"
                      :indeterminate.prop="pageSomeSelected"
                      aria-label="Select all businesses on this page"
                      @change="togglePage"
                    >
                  </th>
                  <th>Business name</th>
                  <th>Industry</th>
                  <th>State / City</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Website</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="biz in leads"
                  :key="biz.id"
                  class="lead-row"
                  :class="{ 'lead-row-selected': selected.has(biz.id) }"
                  @click="onRowClick($event, biz)"
                >
                  <td v-if="!isFree" class="cell-check" data-label="Select">
                    <input
                      type="checkbox"
                      class="row-check"
                      :checked="selected.has(biz.id)"
                      :aria-label="`Select ${biz.name} for export`"
                      @change="toggleSelected(biz)"
                    >
                  </td>
                  <td data-label="Business" class="cell-name">
                    <button type="button" class="td-name-btn" :aria-label="`View details for ${biz.name}`" @click="openDetails(biz)">
                      <span class="td-name">{{ biz.name }}</span>
                      <Icon name="ph:caret-right-bold" class="td-name-caret" />
                    </button>
                  </td>
                  <td data-label="Industry" class="cell-industry"><span class="td-badge">{{ biz.industry_name || '—' }}</span></td>
                  <td data-label="Location" class="td-location">{{ [biz.state_name, biz.city].filter(Boolean).join(', ') || '—' }}</td>
                  <td data-label="Phone">
                    <span v-if="biz.phone" class="td-contact">{{ biz.phone }}</span>
                    <span v-else-if="isFree" class="td-locked"><Icon name="ph:lock-simple-fill" /> Upgrade</span>
                    <span v-else class="td-muted">—</span>
                  </td>
                  <td data-label="Email">
                    <span v-if="biz.email" class="td-contact td-email">{{ biz.email }}</span>
                    <span v-else-if="isFree" class="td-locked"><Icon name="ph:lock-simple-fill" /> Upgrade</span>
                    <span v-else class="td-muted">—</span>
                  </td>
                  <td data-label="Website">
                    <a v-if="biz.website" :href="biz.website" target="_blank" rel="noopener noreferrer" class="td-link">Visit <Icon name="ph:arrow-up-right" /></a>
                    <span v-else class="td-muted">—</span>
                  </td>
                  <td data-label="Rating">
                    <span v-if="biz.rating" class="td-rating"><Icon name="ph:star-fill" /> {{ biz.rating }}</span>
                    <span v-else class="td-muted">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="leads.length" class="table-footer">
            <button type="button" class="l-btn l-btn-outline l-btn-sm" :disabled="!prevUrl" @click="fetchPage(prevUrl, -1)">
              <Icon name="ph:arrow-left" /> <span class="pager-text">Previous</span>
            </button>
            <span class="table-page-info">Page {{ page }} of {{ totalPages || 1 }}</span>
            <button type="button" class="l-btn l-btn-outline l-btn-sm" :disabled="!nextUrl" @click="fetchPage(nextUrl, 1)">
              <span class="pager-text">Next</span> <Icon name="ph:arrow-right" />
            </button>
          </div>
        </template>
      </div>

      <!-- Business details panel -->
      <Teleport to="body">
        <Transition name="drawer">
          <div v-if="activeBiz" class="drawer-root">
            <div class="drawer-backdrop" @click="closeDetails" />
            <aside
              class="drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="drawer-title"
              tabindex="-1"
            >
              <header class="drawer-head">
                <div class="drawer-head-text">
                  <p class="drawer-eyebrow">{{ activeBiz.industry_name || 'Business' }}</p>
                  <h2 id="drawer-title" class="drawer-title">{{ activeBiz.name }}</h2>
                  <div class="drawer-tags">
                    <span v-if="activeBiz.is_verified" class="drawer-tag drawer-tag-ok"><Icon name="ph:seal-check-fill" /> Verified</span>
                    <span v-if="activeBiz.rating" class="drawer-tag">
                      <Icon name="ph:star-fill" /> {{ activeBiz.rating }}
                      <template v-if="activeBiz.review_count">· {{ activeBiz.review_count.toLocaleString() }} reviews</template>
                    </span>
                    <span v-if="locationText(activeBiz)" class="drawer-tag"><Icon name="ph:map-pin-fill" /> {{ locationText(activeBiz) }}</span>
                  </div>
                </div>
                <button ref="drawerClose" type="button" class="drawer-close" aria-label="Close details" @click="closeDetails">
                  <Icon name="ph:x-bold" />
                </button>
              </header>

              <div class="drawer-body">
                <div v-if="isFree" class="drawer-locked">
                  <Icon name="ph:lock-simple-fill" />
                  <p>Contact details are available on paid plans.</p>
                  <NuxtLink to="/dashboard/billing" class="l-btn l-btn-primary l-btn-sm">Upgrade to unlock</NuxtLink>
                </div>

                <template v-else>
                  <section class="drawer-section" aria-labelledby="drawer-contact">
                    <h3 id="drawer-contact" class="drawer-section-title">Contact</h3>
                    <dl class="drawer-list">
                      <div class="drawer-item">
                        <dt><Icon name="ph:phone-fill" /> Phone</dt>
                        <dd>
                          <a v-if="activeBiz.phone" :href="`tel:${activeBiz.phone.replace(/\s+/g, '')}`" class="drawer-link">{{ activeBiz.phone }}</a>
                          <span v-else class="drawer-empty">Not listed</span>
                        </dd>
                      </div>
                      <div class="drawer-item">
                        <dt><Icon name="ph:envelope-simple-fill" /> Email</dt>
                        <dd>
                          <a v-if="activeBiz.email" :href="`mailto:${activeBiz.email}`" class="drawer-link drawer-break">{{ activeBiz.email }}</a>
                          <span v-else class="drawer-empty">Not listed</span>
                        </dd>
                      </div>
                      <div class="drawer-item">
                        <dt><Icon name="ph:globe-fill" /> Website</dt>
                        <dd>
                          <a v-if="activeBiz.website" :href="websiteHref(activeBiz.website)" target="_blank" rel="noopener noreferrer" class="drawer-link drawer-break">
                            {{ websiteLabel(activeBiz.website) }} <Icon name="ph:arrow-up-right" />
                          </a>
                          <span v-else class="drawer-empty">Not listed</span>
                        </dd>
                      </div>
                      <div class="drawer-item">
                        <dt><Icon name="ph:map-pin-fill" /> Address</dt>
                        <dd>
                          <template v-if="activeBiz.address">
                            <span>{{ activeBiz.address }}</span>
                            <a :href="mapsHref(activeBiz)" target="_blank" rel="noopener noreferrer" class="drawer-link drawer-map">
                              Open in Google Maps <Icon name="ph:arrow-up-right" />
                            </a>
                          </template>
                          <span v-else class="drawer-empty">{{ locationText(activeBiz) || 'Not listed' }}</span>
                        </dd>
                      </div>
                    </dl>
                  </section>

                  <section v-if="activeBiz.description" class="drawer-section" aria-labelledby="drawer-about">
                    <h3 id="drawer-about" class="drawer-section-title">About</h3>
                    <p class="drawer-desc">{{ activeBiz.description }}</p>
                  </section>

                  <section class="drawer-section" aria-labelledby="drawer-record">
                    <h3 id="drawer-record" class="drawer-section-title">Record</h3>
                    <dl class="drawer-list drawer-list-compact">
                      <div v-if="activeBiz.source" class="drawer-item"><dt>Source</dt><dd>{{ sourceLabel(activeBiz.source) }}</dd></div>
                      <div v-if="activeBiz.scraped_at" class="drawer-item"><dt>Added</dt><dd>{{ formatDate(activeBiz.scraped_at) }}</dd></div>
                    </dl>
                  </section>
                </template>
              </div>

              <footer v-if="!isFree" class="drawer-foot">
                <button
                  type="button"
                  class="l-btn drawer-select"
                  :class="selected.has(activeBiz.id) ? 'l-btn-outline' : 'l-btn-primary'"
                  :aria-pressed="selected.has(activeBiz.id)"
                  @click="toggleSelected(activeBiz)"
                >
                  <Icon :name="selected.has(activeBiz.id) ? 'ph:check-square-fill' : 'ph:plus-square-bold'" />
                  {{ selected.has(activeBiz.id) ? 'Selected for export' : 'Add to export' }}
                </button>
              </footer>
            </aside>
          </div>
        </Transition>
      </Teleport>

    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { api, hasFullAccess, fetchUser } = useAuth()
const config = useRuntimeConfig()

const PAGE_SIZE = 20
const search = ref(''); const selectedIndustry = ref(''); const selectedState = ref(''); const hasEmail = ref('')
const loading = ref(true); const exporting = ref(false); const error = ref(''); const notice = ref('')
const leads = ref<any[]>([]); const industries = ref<any[]>([]); const states = ref<any[]>([])
const count = ref(0); const nextUrl = ref<string | null>(null); const prevUrl = ref<string | null>(null); const page = ref(1)
const tableCard = ref<HTMLElement | null>(null)

const totalPages = computed(() => Math.ceil(count.value / PAGE_SIZE))
const rangeStart = computed(() => (page.value - 1) * PAGE_SIZE + 1)
const rangeEnd = computed(() => Math.min((page.value - 1) * PAGE_SIZE + leads.value.length, count.value))
const isFree = computed(() => !hasFullAccess.value)
const hasFilters = computed(() => !!(search.value || selectedIndustry.value || selectedState.value || hasEmail.value))

const buildParams = () => {
  const p = new URLSearchParams()
  if (search.value) p.set('search', search.value)
  if (selectedIndustry.value) p.set('industry', selectedIndustry.value)
  if (selectedState.value) p.set('state', selectedState.value)
  if (hasEmail.value) p.set('has_email', hasEmail.value)
  return p.toString()
}

// Ignore slow responses from older requests (fast typing / quick filter changes)
let reqId = 0

const fetchLeads = async () => {
  const id = ++reqId
  loading.value = true; error.value = ''
  try {
    const data: any = await api(`/businesses/?${buildParams()}`)
    if (id !== reqId) return
    leads.value = data.results; count.value = data.count; nextUrl.value = data.next; prevUrl.value = data.previous; page.value = 1
  } catch (err: any) {
    if (id !== reqId) return
    error.value = err?.data?.error || 'Failed to load leads.'
  } finally { if (id === reqId) loading.value = false }
}

const fetchPage = async (url: string | null, delta: number) => {
  if (!url) return
  const id = ++reqId
  loading.value = true
  try {
    const data: any = await $fetch(url, { headers: { Authorization: `Bearer ${useCookie('nd_token').value}` } })
    if (id !== reqId) return
    leads.value = data.results; count.value = data.count; nextUrl.value = data.next; prevUrl.value = data.previous
    page.value += delta
    tableCard.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } catch {
    if (id === reqId) notice.value = 'Could not load that page. Please try again.'
  } finally { if (id === reqId) loading.value = false }
}

let timer: any
const debouncedFetch = () => { clearTimeout(timer); timer = setTimeout(fetchLeads, 400) }

const clearFilters = () => {
  search.value = ''; selectedIndustry.value = ''; selectedState.value = ''; hasEmail.value = ''
  fetchLeads()
}

// Selection for export; kept across pages and filter changes until cleared
const selected = ref(new Map<number, any>())
const toggleSelected = (biz: any) => {
  const next = new Map(selected.value)
  next.has(biz.id) ? next.delete(biz.id) : next.set(biz.id, biz)
  selected.value = next
}
const pageAllSelected = computed(() => leads.value.length > 0 && leads.value.every(b => selected.value.has(b.id)))
const pageSomeSelected = computed(() => !pageAllSelected.value && leads.value.some(b => selected.value.has(b.id)))
const togglePage = () => {
  const next = new Map(selected.value)
  if (pageAllSelected.value) leads.value.forEach(b => next.delete(b.id))
  else leads.value.forEach(b => next.set(b.id, b))
  selected.value = next
}
const clearSelection = () => { selected.value = new Map() }

// Details panel
const activeBiz = ref<any>(null)
const drawerClose = ref<HTMLButtonElement | null>(null)
let lastFocus: HTMLElement | null = null
const openDetails = (biz: any) => {
  lastFocus = document.activeElement as HTMLElement
  activeBiz.value = biz
  nextTick(() => drawerClose.value?.focus())
}
const closeDetails = () => {
  activeBiz.value = null
  nextTick(() => lastFocus?.focus())
}
// Clicking anywhere on a row opens it, except on the checkbox and links inside it
const onRowClick = (e: MouseEvent, biz: any) => {
  if ((e.target as HTMLElement).closest('a, button, input, label')) return
  openDetails(biz)
}
const onKeydown = (e: KeyboardEvent) => { if (e.key === 'Escape' && activeBiz.value) closeDetails() }
watch(activeBiz, (biz) => { document.body.style.overflow = biz ? 'hidden' : '' })

const locationText = (biz: any) => [biz.city, biz.state_name].filter(Boolean).join(', ')
const websiteHref = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`)
const websiteLabel = (url: string) => url.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '')
const mapsHref = (biz: any) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([biz.name, biz.address, biz.city, biz.state_name].filter(Boolean).join(', '))}`
const sourceLabel = (source: string) => ({ google_maps: 'Google Maps' } as Record<string, string>)[source] || source.replace(/_/g, ' ')
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })

const exportLeads = async () => {
  exporting.value = true; notice.value = ''
  const ids = [...selected.value.keys()]
  try {
    const headers = { Authorization: `Bearer ${useCookie('nd_token').value}` }
    // Ticked rows export just those; otherwise export everything matching the filters
    const response = ids.length
      ? await fetch(`${config.public.apiBase}/businesses/export/`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        })
      : await fetch(`${config.public.apiBase}/businesses/export/?${buildParams()}`, { headers })
    if (!response.ok) {
      const d = await response.json().catch(() => ({}))
      notice.value = d.error || 'Export failed.'
      return
    }
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `firmfinderng_leads_${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)

    // Large searches are trimmed to the per-file cap; tell the user so they can narrow it down
    const exported = Number(response.headers.get('X-Export-Count'))
    const maxRows = Number(response.headers.get('X-Export-Max-Rows'))
    if (!ids.length && maxRows && exported >= maxRows && count.value > exported) {
      notice.value = `Exported the first ${exported.toLocaleString()} of ${count.value.toLocaleString()} businesses. Add filters to export a different set.`
    }
    fetchUser() // refresh the leads counter in the header and sidebar
  } catch { notice.value = 'Export failed. Please try again.' }
  finally { exporting.value = false }
}

onMounted(async () => {
  try {
    const [i, s]: any = await Promise.all([api('/businesses/industries/'), api('/businesses/states/')])
    industries.value = i.results || i; states.value = s.results || s
  } catch { /* filters just stay empty; leads can still load */ }
  await fetchLeads()
})
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  clearTimeout(timer)
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.leads {
  /* Nigerian flag green theme */
  --primary: #008751;
  --primary-dark: #006b41;
  --primary-light: #e8f5ee;
  --primary-border: #b7dfc9;
  font-family: var(--font);
  min-width: 0;
}

/* Buttons */
.l-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; height: 44px; padding: 0 1.1rem; font: inherit; font-size: 0.9rem; font-weight: 600; border-radius: var(--radius-md); border: 1px solid transparent; cursor: pointer; text-decoration: none; white-space: nowrap; transition: background 0.15s, border-color 0.15s; }
.l-btn-primary { background: var(--primary); color: white; }
.l-btn-primary:hover:not(:disabled) { background: var(--primary-dark); }
.l-btn-outline { background: var(--cream); color: var(--primary); border-color: var(--primary); }
.l-btn-outline:hover:not(:disabled) { background: var(--primary-light); }
.l-btn-sm { height: 38px; padding: 0 0.9rem; font-size: 0.85rem; }
.l-btn:focus-visible { outline: 2px solid var(--primary-dark); outline-offset: 2px; }
.l-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
.spinner-green { width: 22px; height: 22px; border-color: var(--primary-border); border-top-color: var(--primary); }
@keyframes spin { to { transform: rotate(360deg); } }

/* Notice */
.notice { display: flex; align-items: flex-start; gap: 0.625rem; padding: 0.875rem 1rem; margin-bottom: 1rem; border-radius: var(--radius-md); font-size: 0.875rem; line-height: 1.45; background: #fdf2f2; border: 1px solid #f8b4b4; color: #9b1c1c; }
.notice-text { flex: 1; }
.notice-close { background: transparent; border: 0; color: inherit; cursor: pointer; padding: 2px; display: flex; opacity: 0.7; }
.notice-close:hover { opacity: 1; }

/* Filters */
.filters-card { background: var(--cream); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1rem; margin-bottom: 1rem; box-shadow: var(--shadow-sm); }
.filters-row { display: flex; gap: 0.625rem; flex-wrap: wrap; align-items: center; }
.filter-search-wrap { position: relative; flex: 1; min-width: 220px; }
.filter-search-icon { position: absolute; left: 0.8rem; top: 50%; transform: translateY(-50%); color: var(--placeholder); font-size: 0.95rem; pointer-events: none; }

.f-input { height: 44px; padding: 0 0.875rem; font: inherit; font-size: 1rem; color: var(--gray-900); background-color: var(--input-bg); border: 1px solid var(--input-border); border-radius: var(--radius-md); caret-color: var(--primary); transition: border-color 0.15s, box-shadow 0.15s; }
.f-input::placeholder { color: var(--placeholder); opacity: 1; }
.f-input:hover { border-color: var(--input-border-hover); }
.f-input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(0,135,81,0.18); }
.filter-search { width: 100%; padding-left: 2.4rem; }
.f-select { min-width: 150px; padding-right: 2.25rem; appearance: none; -webkit-appearance: none; cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='none' stroke='%236b7280' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' d='M2.5 4.5 6 8l3.5-3.5'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 0.8rem center; }

.filters-active { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border); font-size: 0.8rem; color: var(--text-muted); }
.link-btn { background: none; border: 0; padding: 0.25rem 0; font: inherit; font-size: 0.8rem; font-weight: 600; color: var(--primary); cursor: pointer; }
.link-btn:hover { text-decoration: underline; }

/* Upgrade banner */
.upgrade-banner { display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1rem; margin-bottom: 1rem; background: var(--primary-light); border: 1px solid var(--primary-border); border-radius: var(--radius-md); color: var(--primary-dark); font-size: 0.875rem; }
.upgrade-text { flex: 1; }
.upgrade-action { display: inline-flex; align-items: center; gap: 0.3rem; font-weight: 700; color: var(--primary-dark); text-decoration: underline; white-space: nowrap; }

/* Results card */
.table-card { background: var(--cream); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm); scroll-margin-top: 5rem; }
.table-state { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 3.5rem 1.5rem; text-align: center; color: var(--text-muted); }
.table-error { color: #b91c1c; }
.table-toolbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem 1rem; padding: 0.875rem 1.25rem; border-bottom: 1px solid var(--border); }
.table-hint { font-size: 0.78rem; color: var(--text-muted); }
.selection-bar { display: inline-flex; align-items: center; gap: 0.875rem; }
.selection-count { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.82rem; font-weight: 700; color: var(--primary-dark); }
.table-count { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }

.empty-state { padding: 3.5rem 1.5rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
.empty-icon { width: 52px; height: 52px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; margin-bottom: 0.25rem; }
.empty-title { font-weight: 700; color: var(--gray-900); }
.empty-sub { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem; }

.table-scroll { overflow-x: auto; }
.leads-table { width: 100%; border-collapse: collapse; }
.leads-table th { text-align: left; padding: 0.75rem 1.25rem; font-size: 0.78rem; font-weight: 600; color: var(--text-muted); background: var(--primary-light); border-bottom: 1px solid var(--primary-border); white-space: nowrap; }
.leads-table td { padding: 0.9rem 1.25rem; border-bottom: 1px solid var(--border); font-size: 0.875rem; vertical-align: middle; }
.leads-table tbody tr:last-child td { border-bottom: 0; }
.leads-table tbody tr:hover { background: #F3EBC0; }
.lead-row { cursor: pointer; }
.lead-row-selected, .leads-table tbody tr.lead-row-selected:hover { background: var(--primary-light); }

/* Selection checkbox */
.leads-table .cell-check { width: 1%; padding-right: 0; }
.row-check { width: 18px; height: 18px; margin: 0; accent-color: var(--primary); cursor: pointer; vertical-align: middle; }
.row-check:focus-visible { outline: 2px solid var(--primary-dark); outline-offset: 2px; }

/* Business name opens the details panel */
.td-name-btn { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0; background: none; border: 0; font: inherit; text-align: left; cursor: pointer; color: inherit; }
.td-name-btn:hover .td-name { color: var(--primary-dark); text-decoration: underline; }
.td-name-btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; border-radius: 4px; }
.td-name-caret { font-size: 0.75rem; color: var(--primary); flex-shrink: 0; }

.td-name { font-weight: 600; color: var(--gray-900); }
.td-badge { display: inline-block; background: var(--primary-light); color: var(--primary-dark); padding: 2px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 600; white-space: nowrap; }
.td-location { color: var(--text-secondary); font-size: 0.85rem; }
.td-contact { font-size: 0.825rem; color: var(--gray-700); }
.td-email { overflow-wrap: anywhere; }
.td-locked { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; }
.td-link { display: inline-flex; align-items: center; gap: 0.2rem; font-size: 0.82rem; color: var(--primary); text-decoration: none; font-weight: 600; }
.td-link:hover { text-decoration: underline; }
.td-rating { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.82rem; font-weight: 600; color: var(--gray-700); }
.td-rating :deep(svg) { color: var(--primary); }
.td-muted { color: var(--gray-300); }

.table-footer { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.875rem 1.25rem; border-top: 1px solid var(--border); }
.table-page-info { font-size: 0.8rem; color: var(--text-muted); }

/* ---------- Details panel ---------- */
.drawer-root { position: fixed; inset: 0; z-index: 300; font-family: var(--font); --primary: #008751; --primary-dark: #006b41; --primary-light: #e8f5ee; --primary-border: #b7dfc9; }
.drawer-backdrop { position: absolute; inset: 0; background: rgba(0, 40, 24, 0.45); }
.drawer {
  position: absolute; top: 0; right: 0; bottom: 0;
  width: min(460px, 100%);
  display: flex; flex-direction: column;
  background: var(--cream); box-shadow: var(--shadow-lg); outline: none;
}
.drawer-head { display: flex; align-items: flex-start; gap: 1rem; padding: 1.5rem; background: linear-gradient(180deg, #00603a 0%, #006b41 100%); color: var(--sand); }
.drawer-head-text { flex: 1; min-width: 0; }
.drawer-eyebrow { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 0.35rem; }
.drawer-title { font-size: 1.3rem; font-weight: 800; line-height: 1.25; color: var(--sand); overflow-wrap: anywhere; }
.drawer-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.75rem; }
.drawer-tag { display: inline-flex; align-items: center; gap: 0.3rem; padding: 3px 10px; font-size: 0.75rem; font-weight: 600; color: var(--sand); background: rgba(232, 226, 194, 0.14); border: 1px solid rgba(232, 226, 194, 0.28); border-radius: 999px; }
.drawer-tag-ok { color: #00603a; background: var(--sand); border-color: var(--sand); }
.drawer-close { flex-shrink: 0; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: transparent; border: 0; border-radius: var(--radius); color: var(--sand); font-size: 1.1rem; cursor: pointer; }
.drawer-close:hover { background: rgba(232, 226, 194, 0.14); }
.drawer-close:focus-visible { outline: 2px solid var(--sand); outline-offset: 1px; }

.drawer-body { flex: 1; overflow-y: auto; padding: 0.5rem 1.5rem 1.5rem; }
.drawer-section { padding: 1.25rem 0; border-bottom: 1px solid var(--border); }
.drawer-section:last-child { border-bottom: 0; }
.drawer-section-title { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.875rem; }
.drawer-list { display: flex; flex-direction: column; gap: 0.875rem; }
.drawer-item { display: grid; grid-template-columns: 6.5rem 1fr; gap: 0.75rem; font-size: 0.9rem; }
.drawer-item dt { display: inline-flex; align-items: flex-start; gap: 0.4rem; font-weight: 600; color: var(--text-secondary); }
.drawer-item dt :deep(svg) { margin-top: 3px; color: var(--primary); flex-shrink: 0; }
.drawer-item dd { margin: 0; min-width: 0; display: flex; flex-direction: column; gap: 0.3rem; color: var(--gray-900); }
.drawer-list-compact .drawer-item { font-size: 0.85rem; }
.drawer-link { display: inline-flex; align-items: center; gap: 0.25rem; color: var(--primary-dark); font-weight: 600; text-decoration: none; }
.drawer-link:hover { text-decoration: underline; }
.drawer-break { overflow-wrap: anywhere; }
.drawer-map { font-size: 0.82rem; }
.drawer-empty { color: var(--text-muted); }
.drawer-desc { font-size: 0.9rem; line-height: 1.6; color: var(--gray-700); white-space: pre-line; }

.drawer-locked { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 2.5rem 1rem; text-align: center; color: var(--text-secondary); }
.drawer-locked :deep(svg) { font-size: 1.5rem; color: var(--primary); }

.drawer-foot { padding: 1rem 1.5rem calc(1rem + env(safe-area-inset-bottom, 0px)); border-top: 1px solid var(--border); }
.drawer-select { width: 100%; }

.drawer-enter-active, .drawer-leave-active { transition: opacity 0.2s ease; }
.drawer-enter-active .drawer, .drawer-leave-active .drawer { transition: transform 0.25s ease; }
.drawer-enter-from, .drawer-leave-to { opacity: 0; }
.drawer-enter-from .drawer, .drawer-leave-to .drawer { transform: translateX(100%); }

/* ---------- Responsive ---------- */
@media (max-width: 900px) {
  .f-select { flex: 1; min-width: 140px; }
  .export-btn { flex: 1; }
}

/* Phones: filters stack, table rows become cards */
@media (max-width: 640px) {
  .filters-row { display: grid; grid-template-columns: 1fr 1fr; }
  .filter-search-wrap { grid-column: 1 / -1; min-width: 0; }
  .f-select { min-width: 0; width: 100%; }
  .f-select:first-of-type { grid-column: 1 / -1; }
  .export-btn { grid-column: 1 / -1; width: 100%; }

  .upgrade-banner { flex-wrap: wrap; }
  .upgrade-text { flex-basis: calc(100% - 2rem); }
  .upgrade-action { margin-left: 1.85rem; }

  .table-toolbar, .table-footer { padding-left: 1rem; padding-right: 1rem; }

  .table-scroll { overflow-x: visible; }
  .leads-table, .leads-table tbody, .leads-table tr, .leads-table td { display: block; width: 100%; }
  .leads-table thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  .leads-table tr { padding: 1rem; border-bottom: 1px solid var(--border); }
  .leads-table tbody tr:last-child { border-bottom: 0; }
  .leads-table tbody tr:hover { background: transparent; }
  .leads-table td { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 0.3rem 0; border: 0; text-align: right; }
  .leads-table td::before { content: attr(data-label); flex-shrink: 0; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-align: left; }
  /* Name + industry read as the card header */
  .leads-table td.cell-name { padding-bottom: 0.1rem; }
  .leads-table td.cell-name::before, .leads-table td.cell-industry::before { display: none; }
  .leads-table td.cell-name { justify-content: flex-start; text-align: left; }
  .leads-table td.cell-industry { justify-content: flex-start; padding-bottom: 0.5rem; }
  .td-name { font-size: 1rem; }
  .leads-table tr.lead-row { position: relative; }
  .leads-table td.cell-check { position: absolute; top: 1rem; right: 1rem; width: auto; padding: 0; }
  .leads-table td.cell-check::before { display: none; }
  .leads-table td.cell-name { padding-right: 2.5rem; }
  .row-check { width: 22px; height: 22px; }
  .drawer-head, .drawer-body, .drawer-foot { padding-left: 1.25rem; padding-right: 1.25rem; }
  .drawer-item { grid-template-columns: 1fr; gap: 0.25rem; }

  .pager-text { display: none; }
  .table-footer .l-btn-sm { min-width: 44px; }
}

@media (hover: none) {
  .leads-table tbody tr:hover { background: transparent; }
}

@media (prefers-reduced-motion: reduce) {
  .spinner { animation-duration: 1.6s; }
  .drawer-enter-active, .drawer-leave-active, .drawer-enter-active .drawer, .drawer-leave-active .drawer { transition: none; }
}
</style>

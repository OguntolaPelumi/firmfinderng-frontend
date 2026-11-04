// Billing pages are hidden while the site runs in free launch mode
export default defineNuxtRouteMiddleware(() => {
  if (useRuntimeConfig().public.freeAccess) {
    return navigateTo('/dashboard')
  }
})

export default defineNuxtRouteMiddleware(() => {
  const token = useCookie('nd_token')
  if (!token.value) {
    return navigateTo('/login')
  }
  // Backstop for a session that predates verification being required
  const user = useState<any>('user')
  if (user.value && user.value.email_verified === false) {
    return navigateTo({ path: '/verify-email', query: { email: user.value.email } })
  }
})

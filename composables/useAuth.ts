export const useAuth = () => {
  const config = useRuntimeConfig()
  const router = useRouter()

  const token = useCookie('nd_token', { maxAge: 86400 * 30 })
  const user = useState('user', () => null as any)

  const isAuthenticated = computed(() => !!token.value)

  // Pricing and upgrade UI only shows when the site is not in free launch mode
  const freeAccess = !!config.public.freeAccess
  // The backend decides access; fall back to the plan for responses that predate these fields
  const hasFullAccess = computed(() => user.value?.has_full_access ?? (freeAccess || user.value?.subscription_plan !== 'free'))
  const hasPremiumReports = computed(() =>
    user.value?.has_premium_reports ?? (freeAccess || ['pro', 'enterprise'].includes(user.value?.subscription_plan)),
  )
  // null when the account has no monthly cap
  const leadsRemaining = computed<number | null>(() => user.value?.leads_remaining ?? null)

  const api = async (endpoint: string, options: any = {}) => {
    return await $fetch(`${config.public.apiBase}${endpoint}`, {
      ...options,
      headers: {
        // Let the browser set the multipart boundary for file uploads
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
        ...options.headers,
      },
    })
  }

  const login = async (email: string, password: string) => {
    const data: any = await api('/auth/login/', {
      method: 'POST',
      body: { email, password },
    })
    token.value = data.access
    await fetchUser()
    return data
  }

  // Creates the account and triggers the confirmation email; no session until the email is confirmed
  const register = async (payload: any) => {
    return await api('/auth/register/', {
      method: 'POST',
      body: payload,
    })
  }

  // Exchanges the token from the confirmation link for a session
  const verifyEmail = async (verifyToken: string) => {
    const data: any = await api('/auth/verify-email/', {
      method: 'POST',
      body: { token: verifyToken },
    })
    token.value = data.tokens.access
    user.value = data.user
    return data
  }

  const resendVerification = async (email: string) => {
    return await api('/auth/resend-verification/', {
      method: 'POST',
      body: { email },
    })
  }

  const logout = () => {
    token.value = null
    user.value = null
    router.push('/login')
  }

  const fetchUser = async () => {
    if (!token.value) return
    try {
      user.value = await api('/auth/profile/')
    } catch {
      logout()
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    freeAccess,
    hasFullAccess,
    hasPremiumReports,
    leadsRemaining,
    api,
    login,
    register,
    verifyEmail,
    resendVerification,
    logout,
    fetchUser,
  }
}

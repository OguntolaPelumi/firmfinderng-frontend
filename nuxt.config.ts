export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'https://pjosh.pythonanywhere.com/api', 
      paystackPublicKey: process.env.NUXT_PUBLIC_PAYSTACK_KEY || '',
      // Free launch: hides pricing, billing and upgrade prompts. Off by default; set
      // NUXT_PUBLIC_FREE_ACCESS=true together with FREE_ACCESS_MODE=True on the backend.
      freeAccess: process.env.NUXT_PUBLIC_FREE_ACCESS === 'true',
    }
  },
  app: {
    head: {
      title: 'FirmFinderNG — Nigerian Business Intelligence Platform',
      meta: [
        { name: 'description', content: 'Access verified Nigerian business data, B2B leads, competitor intelligence and market reports.' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap' }
      ],
      script: [
        { src: 'https://js.paystack.co/v1/inline.js', async: true }
      ]
    }
  }
})

<template>
  <div class="default-layout">
    <div class="default-layout-page">
      <slot />
    </div>
    <!-- Dashboard pages render their own layout, which places the footer beside the sidebar -->
    <AppFooter v-if="!isDashboard" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const isDashboard = computed(() => route.path.startsWith('/dashboard'))
</script>

<style scoped>
.default-layout { min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; }
.default-layout-page { flex: 1; }
</style>

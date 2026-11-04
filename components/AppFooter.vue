<template>
  <footer class="app-footer">
    <a href="https://www.newheavenitsolutions.com" target="_blank" rel="noopener" class="app-footer-link">created by newheavenitsolutions</a>
  </footer>
</template>

<style scoped>
/* Shared credit line shown at the bottom of every page */
.app-footer {
  padding: 1rem 1rem calc(1rem + env(safe-area-inset-bottom, 0px));
  text-align: center;
  background: var(--cream);
  border-top: 1px solid var(--border);
  font-family: var(--font);
}
.app-footer-link { font-size: 0.8rem; font-weight: 500; color: var(--text-muted); text-decoration: none; transition: color 0.15s; }
.app-footer-link:hover { color: #008751; text-decoration: underline; }
.app-footer-link:focus-visible { outline: 2px solid #008751; outline-offset: 2px; border-radius: 2px; }
</style>

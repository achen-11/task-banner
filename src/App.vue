<script setup lang="ts">
import KeyboardShortcutsPanel from '@/components/KeyboardShortcutsPanel.vue'
import GlobalSearch from '@/components/GlobalSearch.vue'
</script>

<template>
  <router-view />
  <KeyboardShortcutsPanel />
  <GlobalSearch />
</template>

<style scoped>
</style>

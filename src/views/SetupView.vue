<script setup>
import { useRouter } from 'vue-router'
import ApiKeySetup from '../components/setup/ApiKeySetup.vue'
import logger from '../services/logger'

const router = useRouter()

function handleComplete() {
  logger.router('Navigating to home after setup complete')
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="setup-view">
    <ApiKeySetup @complete="handleComplete" />
  </div>
</template>

<style scoped>
.setup-view {
  min-height: 100vh;
}
</style>

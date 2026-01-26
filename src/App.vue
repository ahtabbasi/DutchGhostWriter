<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSettingsStore } from './stores/settings'
import { useTranslationsStore } from './stores/translations'
import Sidebar from './components/layout/Sidebar.vue'
import ErrorModal from './components/layout/ErrorModal.vue'
import logger from './services/logger'

const route = useRoute()
const settingsStore = useSettingsStore()
const translationsStore = useTranslationsStore()

const isInitialized = ref(false)
const initError = ref('')
const showInitError = ref(false)

// Hide sidebar on setup page
const showSidebar = computed(() => {
  return route.name !== 'setup' && settingsStore.hasApiKey
})

onMounted(async () => {
  logger.app('Dutch GhostWriter starting...')
  
  try {
    // Initialize settings
    settingsStore.initialize()
    
    // Initialize translations store if API key exists
    if (settingsStore.hasApiKey) {
      await translationsStore.initialize()
    }
    
    isInitialized.value = true
    logger.app('App initialized successfully')
  } catch (error) {
    initError.value = error.message || 'Failed to initialize app'
    showInitError.value = true
    logger.error('App initialization failed', error)
  }
})

// Watch for API key changes to initialize translations
watch(() => settingsStore.hasApiKey, async (hasKey) => {
  if (hasKey && !translationsStore.isInitialized) {
    logger.app('API key set, initializing translations store')
    await translationsStore.initialize()
  }
})
</script>

<template>
  <div class="app-container bg-gradient-main">
    <Sidebar v-if="showSidebar" />
    <main class="main-content" :class="{ 'no-sidebar': !showSidebar }">
      <router-view v-if="isInitialized" />
      <div v-else class="loading-screen">
        <div class="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    </main>
    
    <ErrorModal 
      :show="showInitError"
      title="Initialization Error"
      :message="initError"
      @close="showInitError = false"
    />
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  min-height: 100vh;
  overflow: hidden;
}

.main-content.no-sidebar {
  width: 100%;
}

.loading-screen {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--color-text-secondary);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

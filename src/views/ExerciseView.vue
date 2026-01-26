<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTranslationsStore } from '../stores/translations'
import TranslationTable from '../components/exercise/TranslationTable.vue'
import ErrorModal from '../components/layout/ErrorModal.vue'
import logger from '../services/logger'

const route = useRoute()
const router = useRouter()
const translationsStore = useTranslationsStore()

const isLoading = ref(true)
const error = ref('')
const showError = ref(false)

const translation = computed(() => translationsStore.currentTranslation)
const sentences = computed(() => translation.value?.sentences || [])

onMounted(async () => {
  await loadTranslation()
})

watch(() => route.params.id, async (newId) => {
  if (newId) {
    await loadTranslation()
  }
})

async function loadTranslation() {
  const id = parseInt(route.params.id, 10)
  
  if (isNaN(id)) {
    logger.error('Invalid translation ID')
    router.push({ name: 'home' })
    return
  }
  
  logger.actionStart(`Loading translation: ${id}`)
  isLoading.value = true
  
  try {
    const result = await translationsStore.loadTranslation(id)
    
    if (!result) {
      error.value = 'Translation not found'
      showError.value = true
      logger.actionFail('Translation not found')
    } else {
      logger.actionSuccess(`Loaded translation: ${result.title}`)
    }
  } catch (err) {
    error.value = err.message || 'Failed to load translation'
    showError.value = true
    logger.error('Error loading translation', err)
  } finally {
    isLoading.value = false
  }
}

async function handleUpdateSentence(sentenceId, field, value) {
  try {
    await translationsStore.updateSentence(sentenceId, field, value)
  } catch (err) {
    error.value = 'Failed to save changes'
    showError.value = true
    logger.error('Error updating sentence', err)
  }
}

async function handleAddSentence(afterId) {
  try {
    await translationsStore.addSentence(afterId)
  } catch (err) {
    error.value = 'Failed to add row'
    showError.value = true
    logger.error('Error adding sentence', err)
  }
}

async function handleDeleteSentence(sentenceId) {
  try {
    await translationsStore.deleteSentence(sentenceId)
  } catch (err) {
    error.value = 'Failed to delete row'
    showError.value = true
    logger.error('Error deleting sentence', err)
  }
}

function handleErrorClose() {
  showError.value = false
  
  // If translation not found, go home
  if (!translation.value) {
    router.push({ name: 'home' })
  }
}
</script>

<template>
  <div class="exercise-view">
    <!-- Loading state -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading translation...</p>
    </div>

    <!-- Translation content -->
    <template v-else-if="translation">
      <div class="exercise-header">
        <h1 class="exercise-title">{{ translation.title }}</h1>
        <div class="exercise-meta">
          <span class="meta-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
            {{ sentences.length }} sentences
          </span>
          <span class="meta-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Last edited: {{ new Date(translation.updatedAt).toLocaleString() }}
          </span>
        </div>
      </div>

      <div class="exercise-content">
        <TranslationTable 
          :sentences="sentences"
          @update-sentence="handleUpdateSentence"
          @add-sentence="handleAddSentence"
          @delete-sentence="handleDeleteSentence"
        />
      </div>

      <div class="exercise-footer">
        <p class="auto-save-notice">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Changes are saved automatically
        </p>
      </div>
    </template>

    <!-- Error Modal -->
    <ErrorModal 
      :show="showError"
      title="Error"
      :message="error"
      @close="handleErrorClose"
    />
  </div>
</template>

<style scoped>
.exercise-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 32px;
  overflow-y: auto;
}

.loading-container {
  flex: 1;
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

.exercise-header {
  margin-bottom: 24px;
}

.exercise-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 12px;
}

.exercise-meta {
  display: flex;
  gap: 24px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.exercise-content {
  flex: 1;
}

.exercise-footer {
  margin-top: 24px;
  text-align: center;
}

.auto-save-notice {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  color: var(--color-success);
  margin: 0;
}
</style>

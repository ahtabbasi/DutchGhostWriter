<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTranslationsStore } from '../stores/translations'
import { splitIntoSentences } from '../services/gemini'
import WelcomeMessage from '../components/home/WelcomeMessage.vue'
import TextDialog from '../components/home/TextDialog.vue'
import logger from '../services/logger'

const router = useRouter()
const translationsStore = useTranslationsStore()

const showTextDialog = ref(false)

function openTextDialog() {
  logger.action('Opening text dialog')
  showTextDialog.value = true
}

function closeTextDialog() {
  showTextDialog.value = false
}

async function handleTextSubmit(text) {
  logger.actionStart('Creating translation from submitted text')
  
  try {
    // Split text into sentences
    const sentences = splitIntoSentences(text)
    
    if (sentences.length === 0) {
      logger.warn('No sentences found in text')
      return
    }
    
    // Create translation
    const translation = await translationsStore.createTranslation(text, sentences)
    
    // Close dialog
    showTextDialog.value = false
    
    // Navigate to exercise view
    logger.router(`Navigating to exercise view for translation: ${translation.id}`)
    router.push({ name: 'exercise', params: { id: translation.id } })
  } catch (error) {
    logger.error('Failed to create translation', error)
  }
}
</script>

<template>
  <div class="home-view">
    <WelcomeMessage @add-text="openTextDialog" />
    <TextDialog 
      :show="showTextDialog"
      @close="closeTextDialog"
      @submit="handleTextSubmit"
    />
  </div>
</template>

<style scoped>
.home-view {
  height: 100%;
  overflow-y: auto;
}
</style>

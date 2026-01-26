/**
 * Pinia store for translations management
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  getAllTranslations,
  getTranslation,
  saveTranslation,
  updateTranslation,
  deleteTranslation,
  initDB
} from '../services/storage'
import logger from '../services/logger'

export const useTranslationsStore = defineStore('translations', () => {
  // State
  const translations = ref([])
  const currentTranslation = ref(null)
  const isLoading = ref(false)
  const isInitialized = ref(false)

  // Getters
  const translationCount = computed(() => translations.value.length)
  const hasTranslations = computed(() => translations.value.length > 0)

  // Actions
  async function initialize() {
    if (isInitialized.value) return
    
    logger.app('Initializing translations store...')
    isLoading.value = true
    
    try {
      await initDB()
      await loadTranslations()
      isInitialized.value = true
      logger.app('Translations store initialized')
    } catch (error) {
      logger.error('Failed to initialize translations store', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function loadTranslations() {
    logger.action('Loading all translations')
    isLoading.value = true
    
    try {
      translations.value = await getAllTranslations()
      logger.actionSuccess(`Loaded ${translations.value.length} translations`)
    } catch (error) {
      logger.error('Failed to load translations', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function loadTranslation(id) {
    logger.action(`Loading translation: ${id}`)
    isLoading.value = true
    
    try {
      const translation = await getTranslation(id)
      if (translation) {
        currentTranslation.value = translation
        logger.actionSuccess(`Loaded translation: ${translation.title}`)
      } else {
        logger.actionFail(`Translation not found: ${id}`)
      }
      return translation
    } catch (error) {
      logger.error('Failed to load translation', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function createTranslation(englishText, sentences) {
    logger.action('Creating new translation')
    
    // Generate title from first 5 words of first sentence
    const firstSentence = sentences[0]?.english || englishText
    const words = firstSentence.split(/\s+/).slice(0, 5).join(' ')
    const title = words.length < firstSentence.length ? `${words}...` : words
    
    const newTranslation = {
      title,
      originalText: englishText,
      sentences: sentences.map((s, index) => ({
        id: index + 1,
        english: s.english || s,
        dutch: s.dutch || ''
      }))
    }
    
    try {
      const saved = await saveTranslation(newTranslation)
      currentTranslation.value = saved
      
      // Add to beginning of list (most recent first)
      translations.value.unshift(saved)
      
      logger.actionSuccess(`Created translation: ${saved.title}`, { id: saved.id })
      return saved
    } catch (error) {
      logger.error('Failed to create translation', error)
      throw error
    }
  }

  async function updateCurrentTranslation(updates) {
    if (!currentTranslation.value) {
      logger.warn('No current translation to update')
      return
    }
    
    const id = currentTranslation.value.id
    logger.action(`Updating translation: ${id}`)
    
    try {
      const updated = await updateTranslation(id, updates)
      currentTranslation.value = updated
      
      // Update in list
      const index = translations.value.findIndex(t => t.id === id)
      if (index !== -1) {
        translations.value.splice(index, 1)
        translations.value.unshift(updated) // Move to top (most recently edited)
      }
      
      logger.actionSuccess(`Updated translation: ${updated.title}`)
      return updated
    } catch (error) {
      logger.error('Failed to update translation', error)
      throw error
    }
  }

  async function updateSentence(sentenceId, field, value) {
    if (!currentTranslation.value) return
    
    logger.action(`Updating sentence ${sentenceId}: ${field}`)
    
    const sentences = [...currentTranslation.value.sentences]
    const sentenceIndex = sentences.findIndex(s => s.id === sentenceId)
    
    if (sentenceIndex !== -1) {
      sentences[sentenceIndex] = {
        ...sentences[sentenceIndex],
        [field]: value
      }
      
      await updateCurrentTranslation({ sentences })
    }
  }

  async function addSentence(afterId = null) {
    if (!currentTranslation.value) return
    
    logger.action('Adding new sentence row')
    
    const sentences = [...currentTranslation.value.sentences]
    const newId = Math.max(...sentences.map(s => s.id), 0) + 1
    const newSentence = { id: newId, english: '', dutch: '' }
    
    if (afterId !== null) {
      const index = sentences.findIndex(s => s.id === afterId)
      if (index !== -1) {
        sentences.splice(index + 1, 0, newSentence)
      } else {
        sentences.push(newSentence)
      }
    } else {
      sentences.push(newSentence)
    }
    
    await updateCurrentTranslation({ sentences })
    logger.actionSuccess('Added new sentence row')
  }

  async function deleteSentence(sentenceId) {
    if (!currentTranslation.value) return
    
    const sentence = currentTranslation.value.sentences.find(s => s.id === sentenceId)
    logger.action(`Deleting sentence ${sentenceId}`)
    
    const sentences = currentTranslation.value.sentences.filter(s => s.id !== sentenceId)
    
    await updateCurrentTranslation({ sentences })
    logger.actionSuccess('Deleted sentence row')
    
    return sentence
  }

  async function renameTranslation(id, newTitle) {
    logger.action(`Renaming translation ${id} to: ${newTitle}`)
    
    try {
      const updated = await updateTranslation(id, { title: newTitle })
      
      // Update in list
      const index = translations.value.findIndex(t => t.id === id)
      if (index !== -1) {
        translations.value[index] = updated
      }
      
      // Update current if it's the one being renamed
      if (currentTranslation.value?.id === id) {
        currentTranslation.value = updated
      }
      
      logger.actionSuccess(`Renamed translation to: ${newTitle}`)
      return updated
    } catch (error) {
      logger.error('Failed to rename translation', error)
      throw error
    }
  }

  async function removeTranslation(id) {
    logger.action(`Deleting translation: ${id}`)
    
    try {
      await deleteTranslation(id)
      
      // Remove from list
      translations.value = translations.value.filter(t => t.id !== id)
      
      // Clear current if it's the one being deleted
      if (currentTranslation.value?.id === id) {
        currentTranslation.value = null
      }
      
      logger.actionSuccess(`Deleted translation: ${id}`)
    } catch (error) {
      logger.error('Failed to delete translation', error)
      throw error
    }
  }

  function clearCurrentTranslation() {
    logger.action('Clearing current translation')
    currentTranslation.value = null
  }

  return {
    // State
    translations,
    currentTranslation,
    isLoading,
    isInitialized,
    
    // Getters
    translationCount,
    hasTranslations,
    
    // Actions
    initialize,
    loadTranslations,
    loadTranslation,
    createTranslation,
    updateCurrentTranslation,
    updateSentence,
    addSentence,
    deleteSentence,
    renameTranslation,
    removeTranslation,
    clearCurrentTranslation
  }
})

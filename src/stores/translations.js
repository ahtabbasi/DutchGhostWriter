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
  initDB,
  getApiKey
} from '../services/storage'
import { reviewTranslation } from '../services/gemini'
import logger from '../services/logger'

export const useTranslationsStore = defineStore('translations', () => {
  // State
  const translations = ref([])
  const currentTranslation = ref(null)
  const isLoading = ref(false)
  const isInitialized = ref(false)

  // AI Review State
  const reviewSentenceId = ref(null) // ID of sentence currently being reviewed
  const isReviewLoading = ref(false)
  const reviewError = ref(null)

  // Getters
  const translationCount = computed(() => translations.value.length)
  const hasTranslations = computed(() => translations.value.length > 0)
  
  // Get the current sentence being reviewed
  const currentReviewSentence = computed(() => {
    if (!reviewSentenceId.value || !currentTranslation.value) return null
    return currentTranslation.value.sentences.find(s => s.id === reviewSentenceId.value)
  })
  
  // Get cached review content for the current review sentence
  const currentReviewContent = computed(() => {
    return currentReviewSentence.value?.aiReview?.content || null
  })

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
      const updatedSentence = {
        ...sentences[sentenceIndex],
        [field]: value
      }
      
      // Clear cached AI review when english or dutch content changes
      if (field === 'english' || field === 'dutch') {
        delete updatedSentence.aiReview
        logger.action(`Cleared AI review cache for sentence ${sentenceId}`)
      }
      
      sentences[sentenceIndex] = updatedSentence
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

  // =====================
  // AI Review Functions
  // =====================

  /**
   * Get context sentences (3 before and 3 after) for a given sentence
   */
  function getContextSentences(sentenceId) {
    if (!currentTranslation.value) return { before: [], after: [] }
    
    const sentences = currentTranslation.value.sentences
    const index = sentences.findIndex(s => s.id === sentenceId)
    
    if (index === -1) return { before: [], after: [] }
    
    const before = sentences
      .slice(Math.max(0, index - 3), index)
      .map(s => s.english)
      .filter(text => text?.trim())
    
    const after = sentences
      .slice(index + 1, index + 4)
      .map(s => s.english)
      .filter(text => text?.trim())
    
    return { before, after }
  }

  /**
   * Check if a sentence has a cached AI review
   */
  function hasReviewCache(sentenceId) {
    if (!currentTranslation.value) return false
    const sentence = currentTranslation.value.sentences.find(s => s.id === sentenceId)
    return !!sentence?.aiReview?.content
  }

  /**
   * Open the review sidebar for a sentence
   */
  function openReview(sentenceId) {
    logger.action(`Opening review for sentence ${sentenceId}`)
    reviewSentenceId.value = sentenceId
    reviewError.value = null
  }

  /**
   * Close the review sidebar
   */
  function closeReview() {
    logger.action('Closing review sidebar')
    reviewSentenceId.value = null
    reviewError.value = null
    isReviewLoading.value = false
  }

  /**
   * Request an AI review for the current review sentence
   */
  async function requestReview() {
    if (!reviewSentenceId.value || !currentTranslation.value) return
    
    const sentence = currentTranslation.value.sentences.find(
      s => s.id === reviewSentenceId.value
    )
    
    if (!sentence) {
      reviewError.value = 'Sentence not found'
      return
    }
    
    // Check if we have a cached review
    if (sentence.aiReview?.content) {
      logger.action('Using cached AI review')
      return
    }
    
    const apiKey = getApiKey()
    if (!apiKey) {
      reviewError.value = 'API key not configured. Please set up your API key in Settings.'
      return
    }
    
    logger.actionStart(`Generating AI review for sentence ${reviewSentenceId.value}`)
    isReviewLoading.value = true
    reviewError.value = null
    
    try {
      const { before, after } = getContextSentences(reviewSentenceId.value)
      
      const result = await reviewTranslation(
        apiKey,
        sentence.english,
        sentence.dutch,
        before,
        after
      )
      
      if (!result.success) {
        throw new Error(result.error)
      }
      
      // Save the review to the sentence
      const sentences = [...currentTranslation.value.sentences]
      const sentenceIndex = sentences.findIndex(s => s.id === reviewSentenceId.value)
      
      if (sentenceIndex !== -1) {
        sentences[sentenceIndex] = {
          ...sentences[sentenceIndex],
          aiReview: {
            content: result.content,
            generatedAt: new Date().toISOString()
          }
        }
        
        await updateCurrentTranslation({ sentences })
        logger.actionSuccess('AI review generated and cached')
      }
    } catch (error) {
      logger.error('Failed to generate AI review', error)
      reviewError.value = error.message || 'Failed to generate review'
    } finally {
      isReviewLoading.value = false
    }
  }

  return {
    // State
    translations,
    currentTranslation,
    isLoading,
    isInitialized,
    
    // AI Review State
    reviewSentenceId,
    isReviewLoading,
    reviewError,
    
    // Getters
    translationCount,
    hasTranslations,
    currentReviewSentence,
    currentReviewContent,
    
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
    clearCurrentTranslation,
    
    // AI Review Actions
    getContextSentences,
    hasReviewCache,
    openReview,
    closeReview,
    requestReview
  }
})

/**
 * Pinia store for application settings
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  getApiKey, 
  saveApiKey, 
  removeApiKey,
  getTheme,
  saveTheme,
  getMaxTextLength,
  saveMaxTextLength
} from '../services/storage'
import logger from '../services/logger'

export const useSettingsStore = defineStore('settings', () => {
  // State
  const apiKey = ref('')
  const theme = ref('light')
  const maxTextLength = ref(1000)
  const isInitialized = ref(false)

  // Getters
  const hasApiKey = computed(() => !!apiKey.value)
  const isDarkMode = computed(() => theme.value === 'dark')

  // Actions
  function initialize() {
    logger.app('Initializing settings store...')
    
    apiKey.value = getApiKey() || ''
    theme.value = getTheme()
    maxTextLength.value = getMaxTextLength()
    isInitialized.value = true
    
    // Apply theme to document
    applyTheme(theme.value)
    
    logger.app('Settings store initialized', {
      hasApiKey: hasApiKey.value,
      theme: theme.value,
      maxTextLength: maxTextLength.value
    })
  }

  function setApiKey(key) {
    logger.action('Setting API key')
    apiKey.value = key
    saveApiKey(key)
    logger.actionSuccess('API key saved')
  }

  function clearApiKey() {
    logger.action('Clearing API key')
    apiKey.value = ''
    removeApiKey()
    logger.actionSuccess('API key cleared')
  }

  function setTheme(newTheme) {
    logger.action(`Setting theme to: ${newTheme}`)
    theme.value = newTheme
    saveTheme(newTheme)
    applyTheme(newTheme)
    logger.actionSuccess('Theme updated')
  }

  function toggleTheme() {
    const newTheme = theme.value === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  function applyTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName)
    logger.app(`Applied theme: ${themeName}`)
  }

  function setMaxTextLength(length) {
    const validLength = Math.max(100, Math.min(5000, length))
    logger.action(`Setting max text length to: ${validLength}`)
    maxTextLength.value = validLength
    saveMaxTextLength(validLength)
    logger.actionSuccess('Max text length updated')
  }

  return {
    // State
    apiKey,
    theme,
    maxTextLength,
    isInitialized,
    
    // Getters
    hasApiKey,
    isDarkMode,
    
    // Actions
    initialize,
    setApiKey,
    clearApiKey,
    setTheme,
    toggleTheme,
    setMaxTextLength
  }
})

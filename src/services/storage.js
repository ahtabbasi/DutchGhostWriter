/**
 * Storage service for the Dutch GhostWriter app.
 * Handles both localStorage (settings) and IndexedDB (translations).
 */

import logger from './logger'

const DB_NAME = 'DutchGhostWriterDB'
const DB_VERSION = 1
const TRANSLATIONS_STORE = 'translations'

let db = null

/**
 * Initialize IndexedDB connection
 */
export async function initDB() {
  return new Promise((resolve, reject) => {
    logger.storage('Initializing IndexedDB...')
    
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = (event) => {
      logger.error('Failed to open IndexedDB', event.target.error)
      reject(event.target.error)
    }
    
    request.onsuccess = (event) => {
      db = event.target.result
      logger.storage('IndexedDB initialized successfully')
      resolve(db)
    }
    
    request.onupgradeneeded = (event) => {
      logger.storage('Upgrading IndexedDB schema...')
      const database = event.target.result
      
      // Create translations object store
      if (!database.objectStoreNames.contains(TRANSLATIONS_STORE)) {
        const store = database.createObjectStore(TRANSLATIONS_STORE, { 
          keyPath: 'id',
          autoIncrement: true 
        })
        store.createIndex('updatedAt', 'updatedAt', { unique: false })
        store.createIndex('createdAt', 'createdAt', { unique: false })
        logger.storage('Created translations object store')
      }
    }
  })
}

/**
 * Get the database connection, initializing if needed
 */
async function getDB() {
  if (!db) {
    await initDB()
  }
  return db
}

// =====================
// IndexedDB Operations (Translations)
// =====================

/**
 * Save a new translation
 */
export async function saveTranslation(translation) {
  const database = await getDB()
  
  return new Promise((resolve, reject) => {
    const tx = database.transaction([TRANSLATIONS_STORE], 'readwrite')
    const store = tx.objectStore(TRANSLATIONS_STORE)
    
    const now = new Date().toISOString()
    // Deep clone to remove Vue reactive Proxies - IndexedDB cannot structured-clone Proxies
    const data = JSON.parse(JSON.stringify({
      ...translation,
      createdAt: translation.createdAt || now,
      updatedAt: now
    }))
    
    logger.storageWrite('translation', { id: data.id, title: data.title })
    
    const request = data.id ? store.put(data) : store.add(data)
    
    request.onsuccess = () => {
      const savedId = request.result
      logger.storage(`Translation saved with ID: ${savedId}`)
      resolve({ ...data, id: savedId })
    }
    
    request.onerror = (event) => {
      logger.error('Failed to save translation', event.target.error)
      reject(event.target.error)
    }
  })
}

/**
 * Get a translation by ID
 */
export async function getTranslation(id) {
  const database = await getDB()
  
  return new Promise((resolve, reject) => {
    const tx = database.transaction([TRANSLATIONS_STORE], 'readonly')
    const store = tx.objectStore(TRANSLATIONS_STORE)
    
    logger.storageRead(`translation/${id}`)
    
    const request = store.get(id)
    
    request.onsuccess = () => {
      if (request.result) {
        logger.storage(`Translation found: ${request.result.title}`)
      } else {
        logger.warn(`Translation not found: ${id}`)
      }
      resolve(request.result || null)
    }
    
    request.onerror = (event) => {
      logger.error('Failed to get translation', event.target.error)
      reject(event.target.error)
    }
  })
}

/**
 * Get all translations, sorted by updatedAt (most recent first)
 */
export async function getAllTranslations() {
  const database = await getDB()
  
  return new Promise((resolve, reject) => {
    const tx = database.transaction([TRANSLATIONS_STORE], 'readonly')
    const store = tx.objectStore(TRANSLATIONS_STORE)
    const index = store.index('updatedAt')
    
    logger.storageRead('all translations')
    
    const request = index.openCursor(null, 'prev') // Descending order
    const translations = []
    
    request.onsuccess = (event) => {
      const cursor = event.target.result
      if (cursor) {
        translations.push(cursor.value)
        cursor.continue()
      } else {
        logger.storage(`Retrieved ${translations.length} translations`)
        resolve(translations)
      }
    }
    
    request.onerror = (event) => {
      logger.error('Failed to get translations', event.target.error)
      reject(event.target.error)
    }
  })
}

/**
 * Update a translation
 */
export async function updateTranslation(id, updates) {
  const existing = await getTranslation(id)
  if (!existing) {
    throw new Error(`Translation not found: ${id}`)
  }
  
  const updated = {
    ...existing,
    ...updates,
    id,
    updatedAt: new Date().toISOString()
  }
  
  return saveTranslation(updated)
}

/**
 * Delete a translation
 */
export async function deleteTranslation(id) {
  const database = await getDB()
  
  return new Promise((resolve, reject) => {
    const tx = database.transaction([TRANSLATIONS_STORE], 'readwrite')
    const store = tx.objectStore(TRANSLATIONS_STORE)
    
    logger.storageDelete(`translation/${id}`)
    
    const request = store.delete(id)
    
    request.onsuccess = () => {
      logger.storage(`Translation deleted: ${id}`)
      resolve(true)
    }
    
    request.onerror = (event) => {
      logger.error('Failed to delete translation', event.target.error)
      reject(event.target.error)
    }
  })
}

// =====================
// localStorage Operations (Settings)
// =====================

const STORAGE_KEYS = {
  API_KEY: 'dutchgw_api_key',
  THEME: 'dutchgw_theme',
  MAX_TEXT_LENGTH: 'dutchgw_max_text_length'
}

/**
 * Get API key from localStorage
 */
export function getApiKey() {
  const key = localStorage.getItem(STORAGE_KEYS.API_KEY)
  logger.storageRead('apiKey', key ? '***' : null)
  return key
}

/**
 * Save API key to localStorage
 */
export function saveApiKey(apiKey) {
  logger.storageWrite('apiKey', '***')
  localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey)
}

/**
 * Remove API key from localStorage
 */
export function removeApiKey() {
  logger.storageDelete('apiKey')
  localStorage.removeItem(STORAGE_KEYS.API_KEY)
}

/**
 * Get theme preference from localStorage
 */
export function getTheme() {
  const theme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light'
  logger.storageRead('theme', theme)
  return theme
}

/**
 * Save theme preference to localStorage
 */
export function saveTheme(theme) {
  logger.storageWrite('theme', theme)
  localStorage.setItem(STORAGE_KEYS.THEME, theme)
}

/**
 * Get max text length from localStorage
 */
export function getMaxTextLength() {
  const length = parseInt(localStorage.getItem(STORAGE_KEYS.MAX_TEXT_LENGTH), 10) || 1000
  logger.storageRead('maxTextLength', length)
  return length
}

/**
 * Save max text length to localStorage
 */
export function saveMaxTextLength(length) {
  logger.storageWrite('maxTextLength', length)
  localStorage.setItem(STORAGE_KEYS.MAX_TEXT_LENGTH, String(length))
}

export { STORAGE_KEYS }

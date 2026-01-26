/**
 * Centralized logging service for the Dutch GhostWriter app.
 * Provides categorized console output with timestamps for debugging.
 */

const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
}

const LogCategory = {
  ACTION: 'ACTION',
  API: 'API',
  STORAGE: 'STORAGE',
  ROUTER: 'ROUTER',
  APP: 'APP',
  ERROR: 'ERROR'
}

/**
 * Format timestamp for log output
 */
function getTimestamp() {
  const now = new Date()
  return now.toISOString().slice(11, 23) // HH:MM:SS.mmm format
}

/**
 * Get styled console prefix based on category
 */
function getStyle(category) {
  const styles = {
    [LogCategory.ACTION]: 'color: #10b981; font-weight: bold;',
    [LogCategory.API]: 'color: #3b82f6; font-weight: bold;',
    [LogCategory.STORAGE]: 'color: #f59e0b; font-weight: bold;',
    [LogCategory.ROUTER]: 'color: #8b5cf6; font-weight: bold;',
    [LogCategory.APP]: 'color: #6366f1; font-weight: bold;',
    [LogCategory.ERROR]: 'color: #ef4444; font-weight: bold;'
  }
  return styles[category] || 'color: #64748b; font-weight: bold;'
}

/**
 * Main logging function
 */
function log(level, category, message, data = null) {
  const timestamp = getTimestamp()
  const prefix = `[${timestamp}] [${category}]`
  const style = getStyle(category)
  
  const logFn = {
    [LogLevel.DEBUG]: console.debug,
    [LogLevel.INFO]: console.info,
    [LogLevel.WARN]: console.warn,
    [LogLevel.ERROR]: console.error
  }[level] || console.log

  if (data !== null && data !== undefined) {
    logFn(`%c${prefix}`, style, message, data)
  } else {
    logFn(`%c${prefix}`, style, message)
  }
}

/**
 * Logger object with convenience methods
 */
const logger = {
  // Category-specific logging methods
  action: (message, data = null) => {
    log(LogLevel.INFO, LogCategory.ACTION, `✓ ${message}`, data)
  },
  
  actionStart: (message, data = null) => {
    log(LogLevel.INFO, LogCategory.ACTION, `→ ${message}`, data)
  },
  
  actionSuccess: (message, data = null) => {
    log(LogLevel.INFO, LogCategory.ACTION, `✓ ${message} - SUCCESS`, data)
  },
  
  actionFail: (message, data = null) => {
    log(LogLevel.WARN, LogCategory.ACTION, `✗ ${message} - FAILED`, data)
  },
  
  api: (message, data = null) => {
    log(LogLevel.INFO, LogCategory.API, `⚡ ${message}`, data)
  },
  
  apiRequest: (endpoint, method = 'GET', data = null) => {
    log(LogLevel.INFO, LogCategory.API, `→ ${method} ${endpoint}`, data)
  },
  
  apiSuccess: (endpoint, data = null) => {
    log(LogLevel.INFO, LogCategory.API, `✓ Response received from ${endpoint}`, data)
  },
  
  apiFail: (endpoint, error = null) => {
    log(LogLevel.ERROR, LogCategory.API, `✗ Request failed: ${endpoint}`, error)
  },
  
  storage: (message, data = null) => {
    log(LogLevel.INFO, LogCategory.STORAGE, `💾 ${message}`, data)
  },
  
  storageRead: (key, data = null) => {
    log(LogLevel.DEBUG, LogCategory.STORAGE, `← Read: ${key}`, data)
  },
  
  storageWrite: (key, data = null) => {
    log(LogLevel.INFO, LogCategory.STORAGE, `→ Write: ${key}`, data)
  },
  
  storageDelete: (key) => {
    log(LogLevel.INFO, LogCategory.STORAGE, `✗ Delete: ${key}`)
  },
  
  router: (message, data = null) => {
    log(LogLevel.INFO, LogCategory.ROUTER, `🔀 ${message}`, data)
  },
  
  app: (message, data = null) => {
    log(LogLevel.INFO, LogCategory.APP, `📱 ${message}`, data)
  },
  
  // Level-specific logging methods
  debug: (message, data = null) => {
    log(LogLevel.DEBUG, LogCategory.APP, message, data)
  },
  
  info: (message, data = null) => {
    log(LogLevel.INFO, LogCategory.APP, message, data)
  },
  
  warn: (message, data = null) => {
    log(LogLevel.WARN, LogCategory.APP, `⚠️ ${message}`, data)
  },
  
  error: (message, error = null) => {
    log(LogLevel.ERROR, LogCategory.ERROR, `❌ ${message}`, error)
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack)
    }
  },
  
  // Group logging for complex operations
  group: (label) => {
    console.group(`%c[${getTimestamp()}] ${label}`, 'color: #6366f1; font-weight: bold;')
  },
  
  groupEnd: () => {
    console.groupEnd()
  },
  
  // Table logging for structured data
  table: (data) => {
    console.table(data)
  }
}

export default logger
export { LogLevel, LogCategory }

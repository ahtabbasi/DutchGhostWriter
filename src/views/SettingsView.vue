<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settings'
import { useTheme } from '../composables/useTheme'
import { validateApiKey } from '../services/gemini'
import ErrorModal from '../components/layout/ErrorModal.vue'
import logger from '../services/logger'

const router = useRouter()
const settingsStore = useSettingsStore()
const { isDark, toggleTheme } = useTheme()

// API Key
const showApiKey = ref(false)
const isEditingApiKey = ref(false)
const newApiKey = ref('')
const isValidatingKey = ref(false)
const showRemoveConfirm = ref(false)

// Max Length
const maxLength = ref(settingsStore.maxTextLength)

// Error handling
const errorMessage = ref('')
const showError = ref(false)

const maskedApiKey = computed(() => {
  const key = settingsStore.apiKey
  if (!key) return ''
  if (key.length <= 8) return '*'.repeat(key.length)
  return key.slice(0, 4) + '*'.repeat(key.length - 8) + key.slice(-4)
})

function startEditApiKey() {
  isEditingApiKey.value = true
  newApiKey.value = settingsStore.apiKey
  logger.action('Started editing API key')
}

function cancelEditApiKey() {
  isEditingApiKey.value = false
  newApiKey.value = ''
}

async function saveApiKey() {
  if (!newApiKey.value.trim()) {
    errorMessage.value = 'Please enter an API key'
    showError.value = true
    return
  }
  
  logger.actionStart('Validating new API key')
  isValidatingKey.value = true
  
  try {
    const result = await validateApiKey(newApiKey.value.trim())
    
    if (result.valid) {
      settingsStore.setApiKey(newApiKey.value.trim())
      isEditingApiKey.value = false
      newApiKey.value = ''
      logger.actionSuccess('New API key saved')
    } else {
      errorMessage.value = result.message || 'Invalid API key'
      showError.value = true
      logger.actionFail('API key validation failed')
    }
  } catch (err) {
    errorMessage.value = err.message || 'Failed to validate API key'
    showError.value = true
    logger.error('Error validating API key', err)
  } finally {
    isValidatingKey.value = false
  }
}

function confirmRemoveApiKey() {
  showRemoveConfirm.value = true
}

function cancelRemoveApiKey() {
  showRemoveConfirm.value = false
}

function removeApiKey() {
  logger.action('Removing API key')
  settingsStore.clearApiKey()
  showRemoveConfirm.value = false
  
  // Redirect to setup
  router.push({ name: 'setup' })
}

function handleMaxLengthChange() {
  const value = Math.max(100, Math.min(5000, maxLength.value))
  maxLength.value = value
  settingsStore.setMaxTextLength(value)
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="settings-view">
    <div class="settings-container">
      <div class="settings-header">
        <button class="back-btn" @click="goBack">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <h1 class="settings-title">Settings</h1>
      </div>

      <div class="settings-content">
        <!-- API Key Section -->
        <section class="settings-section">
          <h2 class="section-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
            </svg>
            API Key
          </h2>
          <p class="section-desc">Your Gemini API key is used to generate text and power AI features.</p>

          <div class="setting-card">
            <!-- View mode -->
            <template v-if="!isEditingApiKey">
              <div class="api-key-display">
                <div class="key-value">
                  <span v-if="showApiKey">{{ settingsStore.apiKey }}</span>
                  <span v-else class="masked-key">{{ maskedApiKey }}</span>
                </div>
                <button 
                  class="visibility-btn"
                  @click="showApiKey = !showApiKey"
                  :title="showApiKey ? 'Hide API key' : 'Show API key'"
                >
                  <svg v-if="showApiKey" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </div>
              <div class="api-key-actions">
                <button class="btn btn-secondary" @click="startEditApiKey">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                  </svg>
                  Edit
                </button>
                <button class="btn btn-danger" @click="confirmRemoveApiKey">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  Remove
                </button>
              </div>
            </template>

            <!-- Edit mode -->
            <template v-else>
              <div class="api-key-edit">
                <input 
                  v-model="newApiKey"
                  type="text"
                  class="input api-key-input"
                  placeholder="Enter new API key"
                  :disabled="isValidatingKey"
                />
                <div class="edit-actions">
                  <button 
                    class="btn btn-primary" 
                    @click="saveApiKey"
                    :disabled="isValidatingKey"
                  >
                    <template v-if="isValidatingKey">
                      <span class="spinner"></span>
                      Validating...
                    </template>
                    <template v-else>
                      Save
                    </template>
                  </button>
                  <button class="btn btn-secondary" @click="cancelEditApiKey">
                    Cancel
                  </button>
                </div>
              </div>
            </template>
          </div>
        </section>

        <!-- Appearance Section -->
        <section class="settings-section">
          <h2 class="section-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
            Appearance
          </h2>
          <p class="section-desc">Customize the look and feel of the app.</p>

          <div class="setting-card">
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-label">Dark Mode</span>
                <span class="setting-helper">Switch between light and dark themes</span>
              </div>
              <button 
                class="toggle-switch"
                :class="{ active: isDark }"
                @click="toggleTheme"
                role="switch"
                :aria-checked="isDark"
              >
                <span class="toggle-thumb"></span>
              </button>
            </div>
          </div>
        </section>

        <!-- Text Settings Section -->
        <section class="settings-section">
          <h2 class="section-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="4 7 4 4 20 4 20 7"></polyline>
              <line x1="9" y1="20" x2="15" y2="20"></line>
              <line x1="12" y1="4" x2="12" y2="20"></line>
            </svg>
            Text Settings
          </h2>
          <p class="section-desc">Configure text input and generation settings.</p>

          <div class="setting-card">
            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-label">Maximum Text Length</span>
                <span class="setting-helper">Maximum characters allowed when adding text (100-5000)</span>
              </div>
              <div class="number-input-wrapper">
                <input 
                  v-model.number="maxLength"
                  type="number"
                  class="input number-input"
                  min="100"
                  max="5000"
                  step="100"
                  @change="handleMaxLengthChange"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- About Section -->
        <section class="settings-section">
          <h2 class="section-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            About
          </h2>

          <div class="setting-card about-card">
            <div class="about-content">
              <div class="about-logo">🇳🇱</div>
              <h3 class="about-name">Dutch GhostWriter</h3>
              <p class="about-desc">A language learning tool to practice Dutch translations with AI assistance.</p>
              <p class="about-version">Version 1.0.0</p>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- Remove API Key Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showRemoveConfirm" class="modal-backdrop" @click.self="cancelRemoveApiKey">
        <div class="modal-content confirm-modal animate-slide-in">
          <div class="confirm-icon warning">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <h3 class="confirm-title">Remove API Key?</h3>
          <p class="confirm-message">You will need to enter a new API key to continue using the app.</p>
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="cancelRemoveApiKey">Cancel</button>
            <button class="btn btn-danger" @click="removeApiKey">Remove</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Error Modal -->
    <ErrorModal 
      :show="showError"
      title="Error"
      :message="errorMessage"
      @close="showError = false"
    />
  </div>
</template>

<style scoped>
.settings-view {
  height: 100%;
  overflow-y: auto;
  padding: 32px;
}

.settings-container {
  max-width: 700px;
  margin: 0 auto;
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.back-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: none;
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.back-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.settings-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.section-desc {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  margin: 0;
}

.setting-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.api-key-display {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-bg-tertiary);
  border-radius: 8px;
  margin-bottom: 16px;
}

.key-value {
  flex: 1;
  font-family: monospace;
  font-size: 0.9375rem;
  color: var(--color-text-primary);
  word-break: break-all;
}

.masked-key {
  letter-spacing: 0.1em;
}

.visibility-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: var(--color-bg-secondary);
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.visibility-btn:hover {
  color: var(--color-text-primary);
}

.api-key-actions {
  display: flex;
  gap: 12px;
}

.api-key-edit {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.edit-actions {
  display: flex;
  gap: 12px;
}

.api-key-input {
  font-family: monospace;
  font-size: 0.9375rem;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-label {
  font-weight: 500;
  color: var(--color-text-primary);
}

.setting-helper {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.toggle-switch {
  width: 52px;
  height: 28px;
  border-radius: 14px;
  border: none;
  background: var(--color-bg-tertiary);
  cursor: pointer;
  position: relative;
  transition: background-color 0.2s ease;
}

.toggle-switch.active {
  background: var(--color-accent);
}

.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: white;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease;
}

.toggle-switch.active .toggle-thumb {
  transform: translateX(24px);
}

.number-input-wrapper {
  width: 120px;
}

.number-input {
  text-align: center;
}

.about-card {
  text-align: center;
}

.about-content {
  padding: 16px 0;
}

.about-logo {
  font-size: 3rem;
  margin-bottom: 12px;
}

.about-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 8px;
}

.about-desc {
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  margin: 0 0 8px;
}

.about-version {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  margin: 0;
}

/* Confirm modal styles */
.confirm-modal {
  width: 380px;
  padding: 32px;
  text-align: center;
}

.confirm-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-icon.warning {
  background: color-mix(in srgb, var(--color-warning) 15%, transparent);
  color: var(--color-warning);
}

.confirm-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 8px;
}

.confirm-message {
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  margin: 0 0 24px;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

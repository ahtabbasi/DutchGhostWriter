<script setup>
import { ref } from 'vue'
import { useSettingsStore } from '../../stores/settings'
import { validateApiKey } from '../../services/gemini'
import logger from '../../services/logger'

const emit = defineEmits(['complete'])

const settingsStore = useSettingsStore()

const apiKey = ref('')
const isValidating = ref(false)
const error = ref('')
const showKey = ref(false)

async function handleSubmit() {
  if (!apiKey.value.trim()) {
    error.value = 'Please enter your API key'
    return
  }
  
  logger.actionStart('Validating API key')
  isValidating.value = true
  error.value = ''
  
  try {
    const result = await validateApiKey(apiKey.value.trim())
    
    if (result.valid) {
      settingsStore.setApiKey(apiKey.value.trim())
      logger.actionSuccess('API key validated and saved')
      emit('complete')
    } else {
      error.value = result.message || 'Invalid API key'
      logger.actionFail('API key validation failed', result.message)
    }
  } catch (err) {
    error.value = err.message || 'Failed to validate API key'
    logger.error('API key validation error', err)
  } finally {
    isValidating.value = false
  }
}

function toggleShowKey() {
  showKey.value = !showKey.value
}
</script>

<template>
  <div class="setup-container">
    <div class="setup-card card animate-slide-in">
      <div class="setup-header">
        <div class="logo">
          <span class="logo-icon">🇳🇱</span>
          <h1 class="logo-text">Dutch GhostWriter</h1>
        </div>
        <p class="tagline">Practice Dutch translations with AI-powered assistance</p>
      </div>

      <div class="setup-content">
        <h2 class="section-title">Get Started</h2>
        <p class="section-desc">
          To use this app, you'll need a Google Gemini API key. The key is stored locally on your device and never sent anywhere except to Google's API.
        </p>

        <div class="instructions">
          <h3 class="instructions-title">How to get your API key:</h3>
          <ol class="instructions-list">
            <li>
              Go to <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>
            </li>
            <li>Sign in with your Google account</li>
            <li>Click "Create API key"</li>
            <li>Copy the generated key and paste it below</li>
          </ol>
        </div>

        <form @submit.prevent="handleSubmit" class="api-form">
          <div class="form-group">
            <label for="apiKey" class="form-label">Gemini API Key</label>
            <div class="input-wrapper">
              <input 
                id="apiKey"
                v-model="apiKey"
                :type="showKey ? 'text' : 'password'"
                class="input"
                placeholder="Enter your API key"
                :disabled="isValidating"
              />
              <button 
                type="button" 
                class="toggle-visibility"
                @click="toggleShowKey"
                :title="showKey ? 'Hide API key' : 'Show API key'"
              >
                <svg v-if="showKey" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>

          <div v-if="error" class="error-message">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {{ error }}
          </div>

          <button type="submit" class="btn btn-primary btn-lg" :disabled="isValidating">
            <template v-if="isValidating">
              <span class="spinner"></span>
              Validating...
            </template>
            <template v-else>
              Get Started
            </template>
          </button>
        </form>
      </div>

      <div class="setup-footer">
        <p class="privacy-note">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          Your API key is stored securely in your browser's local storage
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.setup-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(135deg, 
    var(--color-bg-primary) 0%, 
    color-mix(in srgb, var(--gradient-start) 8%, var(--color-bg-primary)) 50%,
    color-mix(in srgb, var(--gradient-end) 8%, var(--color-bg-primary)) 100%
  );
}

.setup-card {
  width: 100%;
  max-width: 480px;
  padding: 0;
  overflow: hidden;
}

.setup-header {
  text-align: center;
  padding: 32px 32px 24px;
  background: var(--gradient-accent);
  color: white;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;
}

.logo-icon {
  font-size: 2rem;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.tagline {
  margin: 0;
  opacity: 0.9;
  font-size: 0.9375rem;
}

.setup-content {
  padding: 32px;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 8px;
}

.section-desc {
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  line-height: 1.6;
  margin: 0 0 24px;
}

.instructions {
  background: var(--color-bg-tertiary);
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 24px;
}

.instructions-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 12px;
}

.instructions-list {
  margin: 0;
  padding-left: 20px;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  line-height: 1.8;
}

.instructions-list a {
  color: var(--color-accent);
  text-decoration: none;
  font-weight: 500;
}

.instructions-list a:hover {
  text-decoration: underline;
}

.api-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper .input {
  padding-right: 44px;
}

.toggle-visibility {
  position: absolute;
  right: 8px;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.toggle-visibility:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: color-mix(in srgb, var(--color-error) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-error) 30%, transparent);
  border-radius: 8px;
  color: var(--color-error);
  font-size: 0.875rem;
}

.btn-lg {
  padding: 14px 24px;
  font-size: 1rem;
}

.spinner {
  width: 18px;
  height: 18px;
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

.setup-footer {
  padding: 16px 32px;
  background: var(--color-bg-tertiary);
  border-top: 1px solid var(--color-border);
}

.privacy-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}
</style>

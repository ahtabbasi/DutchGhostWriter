<script setup>
import { ref, computed, watch } from 'vue'
import { useSettingsStore } from '../../stores/settings'
import { generateText, generateFromPreset, PRESET_TOPICS } from '../../services/gemini'
import logger from '../../services/logger'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'submit'])

const settingsStore = useSettingsStore()

const text = ref('')
const aiPrompt = ref('')
const selectedPreset = ref('')
const isGenerating = ref(false)
const error = ref('')
const activeTab = ref('manual') // 'manual' or 'ai'

const maxLength = computed(() => settingsStore.maxTextLength)
const charCount = computed(() => text.value.length)
const isOverLimit = computed(() => charCount.value > maxLength.value)
const canSubmit = computed(() => text.value.trim().length > 0 && !isOverLimit.value)

watch(() => props.show, (newVal) => {
  if (newVal) {
    // Reset state when dialog opens
    text.value = ''
    aiPrompt.value = ''
    selectedPreset.value = ''
    error.value = ''
    activeTab.value = 'manual'
    logger.action('Text dialog opened')
  }
})

async function handleGenerateFromPreset() {
  if (!selectedPreset.value) {
    error.value = 'Please select a topic'
    return
  }
  
  logger.actionStart(`Generating text from preset: ${selectedPreset.value}`)
  isGenerating.value = true
  error.value = ''
  
  try {
    const result = await generateFromPreset(
      settingsStore.apiKey,
      selectedPreset.value,
      maxLength.value
    )
    
    if (result.success) {
      text.value = result.text
      activeTab.value = 'manual' // Switch to manual tab to show the generated text
      logger.actionSuccess('Text generated from preset')
    } else {
      error.value = result.error || 'Failed to generate text'
      logger.actionFail('Failed to generate text from preset')
    }
  } catch (err) {
    error.value = err.message || 'An error occurred'
    logger.error('Error generating text from preset', err)
  } finally {
    isGenerating.value = false
  }
}

async function handleGenerateCustom() {
  if (!aiPrompt.value.trim()) {
    error.value = 'Please enter a prompt'
    return
  }
  
  logger.actionStart('Generating text from custom prompt')
  isGenerating.value = true
  error.value = ''
  
  try {
    const result = await generateText(
      settingsStore.apiKey,
      aiPrompt.value.trim(),
      maxLength.value
    )
    
    if (result.success) {
      text.value = result.text
      activeTab.value = 'manual' // Switch to manual tab to show the generated text
      logger.actionSuccess('Text generated from custom prompt')
    } else {
      error.value = result.error || 'Failed to generate text'
      logger.actionFail('Failed to generate text from custom prompt')
    }
  } catch (err) {
    error.value = err.message || 'An error occurred'
    logger.error('Error generating text from custom prompt', err)
  } finally {
    isGenerating.value = false
  }
}

function handleSubmit() {
  if (!canSubmit.value) {
    if (!text.value.trim()) {
      error.value = 'Please add some text to translate'
    }
    return
  }
  
  logger.action('Submitting text for translation')
  emit('submit', text.value.trim())
}

function handleClose() {
  logger.action('Text dialog closed')
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-backdrop" @click.self="handleClose">
      <div class="modal-content text-dialog animate-slide-in">
        <div class="modal-header">
          <h2 class="modal-title">Add Text to Translate</h2>
          <button class="close-btn" @click="handleClose">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="modal-tabs">
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'manual' }"
            @click="activeTab = 'manual'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Manual Entry
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'ai' }"
            @click="activeTab = 'ai'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"></path>
            </svg>
            AI Generate
          </button>
        </div>

        <div class="modal-body">
          <!-- Manual Entry Tab -->
          <div v-show="activeTab === 'manual'" class="tab-content">
            <div class="form-group">
              <label class="form-label">English Text</label>
              <textarea 
                v-model="text"
                class="input textarea"
                placeholder="Paste or type your English text here..."
                rows="8"
              ></textarea>
              <div class="char-counter" :class="{ 'over-limit': isOverLimit }">
                {{ charCount }} / {{ maxLength }} characters
              </div>
            </div>
          </div>

          <!-- AI Generate Tab -->
          <div v-show="activeTab === 'ai'" class="tab-content">
            <div class="form-group">
              <label class="form-label">Quick Topics</label>
              <div class="preset-grid">
                <button 
                  v-for="preset in PRESET_TOPICS"
                  :key="preset.id"
                  class="preset-btn"
                  :class="{ active: selectedPreset === preset.id }"
                  @click="selectedPreset = preset.id"
                >
                  {{ preset.label }}
                </button>
              </div>
              <button 
                class="btn btn-secondary generate-btn"
                :disabled="!selectedPreset || isGenerating"
                @click="handleGenerateFromPreset"
              >
                <template v-if="isGenerating">
                  <span class="spinner"></span>
                  Generating...
                </template>
                <template v-else>
                  Generate from Topic
                </template>
              </button>
            </div>

            <div class="divider">
              <span>or</span>
            </div>

            <div class="form-group">
              <label class="form-label">Custom Prompt</label>
              <textarea 
                v-model="aiPrompt"
                class="input textarea"
                placeholder="Describe what kind of text you want to generate..."
                rows="3"
              ></textarea>
              <button 
                class="btn btn-secondary generate-btn"
                :disabled="!aiPrompt.trim() || isGenerating"
                @click="handleGenerateCustom"
              >
                <template v-if="isGenerating">
                  <span class="spinner"></span>
                  Generating...
                </template>
                <template v-else>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                  Generate Text
                </template>
              </button>
            </div>

            <div v-if="text" class="generated-preview">
              <label class="form-label">Generated Text Preview</label>
              <div class="preview-text">{{ text }}</div>
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
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="handleClose">
            Cancel
          </button>
          <button 
            class="btn btn-primary" 
            :disabled="!canSubmit"
            @click="handleSubmit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
            Translate
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.text-dialog {
  width: 600px;
  max-width: 95vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.modal-tabs {
  display: flex;
  padding: 0 24px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-tertiary);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  background: none;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: var(--color-text-primary);
}

.tab-btn.active {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
  background: var(--color-bg-secondary);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.tab-content {
  animation: fadeIn 0.2s ease;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.textarea {
  min-height: 120px;
  resize: vertical;
}

.char-counter {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-align: right;
}

.char-counter.over-limit {
  color: var(--color-error);
  font-weight: 500;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.preset-btn {
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.preset-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-text-primary);
}

.preset-btn.active {
  border-color: var(--color-accent);
  background: var(--color-accent-light);
  color: var(--color-accent);
}

.generate-btn {
  margin-top: 12px;
}

.divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 24px 0;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.generated-preview {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--color-border);
}

.preview-text {
  padding: 16px;
  background: var(--color-bg-tertiary);
  border-radius: 8px;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  max-height: 150px;
  overflow-y: auto;
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
  margin-top: 16px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-tertiary);
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

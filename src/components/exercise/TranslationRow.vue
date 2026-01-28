<script setup>
import { ref, watch, computed } from 'vue'
import logger from '../../services/logger'
import { shouldHidePopupWarning } from '../../services/storage'
import { useTranslationsStore } from '../../stores/translations'
import TranslatePopupDialog from './TranslatePopupDialog.vue'

const translationsStore = useTranslationsStore()

const props = defineProps({
  sentence: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['update', 'add-after', 'delete', 'request-review'])

const englishValue = ref(props.sentence.english)
const dutchValue = ref(props.sentence.dutch)
const showPopupDialog = ref(false)

// Show review button only when both English and Dutch have content
const showReviewButton = computed(() => {
  return englishValue.value?.trim() && dutchValue.value?.trim()
})

// Check if this sentence has a cached AI review
const hasCachedReview = computed(() => {
  return translationsStore.hasReviewCache(props.sentence.id)
})

// Check if the cached review is stale (content changed since review)
const isReviewStale = computed(() => {
  return translationsStore.isReviewStale(props.sentence.id)
})

// Check if this row is currently being reviewed
const isBeingReviewed = computed(() => {
  return translationsStore.reviewSentenceId === props.sentence.id
})

// Debounce timer
let debounceTimer = null

watch(() => props.sentence, (newVal) => {
  englishValue.value = newVal.english
  dutchValue.value = newVal.dutch
}, { deep: true })

function handleEnglishChange() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    logger.action(`Updating English text for sentence ${props.sentence.id}`)
    emit('update', props.sentence.id, 'english', englishValue.value)
  }, 500)
}

function handleDutchChange() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    logger.action(`Updating Dutch translation for sentence ${props.sentence.id}`)
    emit('update', props.sentence.id, 'dutch', dutchValue.value)
  }, 500)
}

function handleAddAfter() {
  logger.action(`Adding row after sentence ${props.sentence.id}`)
  emit('add-after', props.sentence.id)
}

function handleDelete() {
  logger.action(`Deleting sentence ${props.sentence.id}`)
  emit('delete', props.sentence.id)
}

function handleTranslate() {
  const text = englishValue.value.trim()
  if (!text) return
  
  logger.action(`Opening Google Translate for sentence ${props.sentence.id}`)
  
  // Show popup warning dialog if not hidden
  if (!shouldHidePopupWarning()) {
    showPopupDialog.value = true
  }
  
  // Open Google Translate in popup window
  const encoded = encodeURIComponent(text)
  const url = `https://translate.google.com/?sl=en&tl=nl&text=${encoded}&op=translate`
  
  const width = 550
  const height = 650
  const left = window.screenX + (window.outerWidth - width) / 2
  const top = window.screenY + (window.outerHeight - height) / 2
  
  window.open(
    url,
    'GoogleTranslate',
    `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
  )
}

function handleReview() {
  logger.action(`Requesting AI review for sentence ${props.sentence.id}`)
  translationsStore.openReview(props.sentence.id)
}

const isEmpty = () => !englishValue.value.trim() && !dutchValue.value.trim()
</script>

<template>
  <tr class="translation-row">
    <td class="row-number">{{ index + 1 }}</td>
    <td class="english-cell">
      <div class="english-cell-content">
        <textarea 
          v-model="englishValue"
          class="cell-input"
          placeholder="English text..."
          @input="handleEnglishChange"
          rows="2"
        ></textarea>
        <button 
          v-if="englishValue.trim()"
          class="translate-btn"
          @click="handleTranslate"
          title="Translate to Dutch with Google Translate"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m5 8 6 6"></path>
            <path d="m4 14 6-6 2-3"></path>
            <path d="M2 5h12"></path>
            <path d="M7 2h1"></path>
            <path d="m22 22-5-10-5 10"></path>
            <path d="M14 18h6"></path>
          </svg>
          <span class="translate-tooltip">Translate to Dutch</span>
        </button>
      </div>
    </td>
    <td class="dutch-cell">
      <div class="dutch-cell-content">
        <textarea 
          v-model="dutchValue"
          class="cell-input dutch-input"
          placeholder="Enter Dutch translation..."
          @input="handleDutchChange"
          rows="2"
        ></textarea>
        <button 
          v-if="showReviewButton"
          class="review-btn"
          :class="{ 
            'has-cache': hasCachedReview && !isReviewStale, 
            'is-stale': isReviewStale,
            'is-active': isBeingReviewed 
          }"
          @click="handleReview"
          :title="isReviewStale ? 'Review Outdated' : (hasCachedReview ? 'View AI Review' : 'Get AI Review')"
        >
          <!-- Sparkle icon for no review -->
          <svg v-if="!hasCachedReview" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
            <path d="M20 3v4"/>
            <path d="M22 5h-4"/>
          </svg>
          <!-- Recycle icon for stale cached review -->
          <svg v-else-if="isReviewStale" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
            <path d="M16 16h5v5"/>
          </svg>
          <!-- Checkmark icon for fresh cached review -->
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
          <span class="review-btn-text">Review</span>
        </button>
      </div>
    </td>
    <td class="actions-cell">
      <div class="row-actions">
        <button 
          class="action-btn add-btn" 
          @click="handleAddAfter"
          title="Add row below"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <button 
          class="action-btn delete-btn" 
          @click="handleDelete"
          title="Delete row"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </td>
  </tr>
  
  <!-- Popup Warning Dialog -->
  <TranslatePopupDialog 
    :show="showPopupDialog" 
    @close="showPopupDialog = false" 
  />
</template>

<style scoped>
.translation-row {
  transition: background-color 0.2s ease;
}

.translation-row:hover {
  background: var(--color-bg-tertiary);
}

.row-number {
  width: 40px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 500;
  vertical-align: top;
  padding-top: 16px !important;
}

.english-cell,
.dutch-cell {
  width: 42%;
  vertical-align: top;
}

.english-cell-content {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.english-cell-content .cell-input {
  flex: 1;
}

.translate-btn {
  position: relative;
  width: 32px;
  height: 32px;
  min-width: 32px;
  border-radius: 6px;
  border: none;
  background: var(--color-bg-tertiary);
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  margin-top: 6px;
}

.translate-btn:hover {
  background: var(--color-accent-light);
  color: var(--color-accent);
  transform: scale(1.05);
}

.translate-btn:active {
  transform: scale(0.95);
}

.translate-tooltip {
  position: absolute;
  right: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border);
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  pointer-events: none;
}

.translate-tooltip::after {
  content: '';
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  border: 5px solid transparent;
  border-left-color: var(--color-border);
}

.translate-btn:hover .translate-tooltip {
  opacity: 1;
  visibility: visible;
}

.actions-cell {
  width: 70px;
  vertical-align: top;
  padding-top: 12px !important;
}

.cell-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-primary);
  font-size: 0.9375rem;
  line-height: 1.5;
  resize: none;
  transition: all 0.2s ease;
}

.cell-input:hover {
  background: var(--color-bg-secondary);
  border-color: var(--color-border);
}

.cell-input:focus {
  outline: none;
  background: var(--color-bg-secondary);
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px var(--color-accent-light);
}

.cell-input::placeholder {
  color: var(--color-text-muted);
}

.dutch-cell-content {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.dutch-cell-content .cell-input {
  flex: 1;
}

.dutch-input {
  /* Dutch text styling */
}

.review-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 6px;
  border: none;
  background: var(--color-bg-tertiary);
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.2s ease;
  margin-top: 6px;
  white-space: nowrap;
}

.review-btn:hover {
  background: var(--color-accent-light);
  color: var(--color-accent);
  transform: translateY(-1px);
}

.review-btn:active {
  transform: translateY(0);
}

.review-btn.has-cache {
  background: color-mix(in srgb, var(--color-success) 15%, transparent);
  color: var(--color-success);
}

.review-btn.has-cache:hover {
  background: color-mix(in srgb, var(--color-success) 25%, transparent);
}

.review-btn.is-stale {
  background: color-mix(in srgb, var(--color-success) 15%, transparent);
  color: var(--color-success);
}

.review-btn.is-stale:hover {
  background: color-mix(in srgb, var(--color-success) 25%, transparent);
}

.review-btn.is-active {
  background: var(--color-accent);
  color: white;
}

.review-btn.is-active:hover {
  background: var(--color-accent-hover);
}

.review-btn-text {
  /* Text styling */
}

.row-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.translation-row:hover .row-actions {
  opacity: 1;
}

.action-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: var(--color-bg-secondary);
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.action-btn:hover {
  color: var(--color-text-primary);
}

.add-btn:hover {
  background: var(--color-accent-light);
  color: var(--color-accent);
}

.delete-btn:hover {
  background: color-mix(in srgb, var(--color-error) 15%, transparent);
  color: var(--color-error);
}
</style>

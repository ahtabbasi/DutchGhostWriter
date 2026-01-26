<script setup>
import { ref, watch } from 'vue'
import logger from '../../services/logger'

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

const emit = defineEmits(['update', 'add-after', 'delete'])

const englishValue = ref(props.sentence.english)
const dutchValue = ref(props.sentence.dutch)

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

const isEmpty = () => !englishValue.value.trim() && !dutchValue.value.trim()
</script>

<template>
  <tr class="translation-row">
    <td class="row-number">{{ index + 1 }}</td>
    <td class="english-cell">
      <textarea 
        v-model="englishValue"
        class="cell-input"
        placeholder="English text..."
        @input="handleEnglishChange"
        rows="2"
      ></textarea>
    </td>
    <td class="dutch-cell">
      <textarea 
        v-model="dutchValue"
        class="cell-input dutch-input"
        placeholder="Enter Dutch translation..."
        @input="handleDutchChange"
        rows="2"
      ></textarea>
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

.dutch-input {
  /* Dutch text styling */
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

<script setup>
import { ref } from 'vue'
import TranslationRow from './TranslationRow.vue'
import logger from '../../services/logger'

const props = defineProps({
  sentences: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update-sentence', 'add-sentence', 'delete-sentence'])

const showDeleteConfirm = ref(null)

function handleUpdate(sentenceId, field, value) {
  emit('update-sentence', sentenceId, field, value)
}

function handleAddAfter(sentenceId) {
  emit('add-sentence', sentenceId)
}

function handleDelete(sentenceId) {
  const sentence = props.sentences.find(s => s.id === sentenceId)
  const isEmpty = !sentence?.english?.trim() && !sentence?.dutch?.trim()
  
  if (isEmpty) {
    // Delete immediately if empty
    logger.action('Deleting empty row without confirmation')
    emit('delete-sentence', sentenceId)
  } else {
    // Show confirmation for non-empty rows
    showDeleteConfirm.value = sentenceId
  }
}

function confirmDelete() {
  if (showDeleteConfirm.value) {
    emit('delete-sentence', showDeleteConfirm.value)
    showDeleteConfirm.value = null
  }
}

function cancelDelete() {
  showDeleteConfirm.value = null
}

function addRowAtEnd() {
  logger.action('Adding row at end')
  emit('add-sentence', null)
}
</script>

<template>
  <div class="table-container">
    <table class="translation-table">
      <thead>
        <tr>
          <th class="header-number">#</th>
          <th class="header-english">English (Source)</th>
          <th class="header-dutch">Dutch (Translation)</th>
          <th class="header-actions"></th>
        </tr>
      </thead>
      <tbody>
        <TranslationRow 
          v-for="(sentence, index) in sentences"
          :key="sentence.id"
          :sentence="sentence"
          :index="index"
          @update="handleUpdate"
          @add-after="handleAddAfter"
          @delete="handleDelete"
        />
      </tbody>
    </table>

    <div class="table-footer">
      <button class="btn btn-secondary add-row-btn" @click="addRowAtEnd">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Add Row
      </button>
    </div>

    <!-- Delete confirmation modal -->
    <Teleport to="body">
      <div v-if="showDeleteConfirm" class="modal-backdrop" @click.self="cancelDelete">
        <div class="modal-content confirm-modal animate-slide-in">
          <div class="confirm-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <h3 class="confirm-title">Delete this row?</h3>
          <p class="confirm-message">This row contains content and cannot be recovered.</p>
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="cancelDelete">Cancel</button>
            <button class="btn btn-danger" @click="confirmDelete">Delete</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.table-container {
  background: var(--color-bg-secondary);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border);
}

.translation-table {
  width: 100%;
  border-collapse: collapse;
}

.translation-table th {
  padding: 14px 16px;
  text-align: left;
  background: var(--color-bg-tertiary);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
}

.header-number {
  width: 40px;
  text-align: center;
}

.header-english,
.header-dutch {
  width: 42%;
}

.header-actions {
  width: 70px;
}

.translation-table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border);
}

.table-footer {
  padding: 16px;
  background: var(--color-bg-tertiary);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: center;
}

.add-row-btn {
  gap: 8px;
}

/* Confirm modal styles */
.confirm-modal {
  width: 360px;
  padding: 32px;
  text-align: center;
}

.confirm-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-warning) 15%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
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
</style>

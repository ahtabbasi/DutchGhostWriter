<script setup>
import logger from '../../services/logger'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Error'
  },
  message: {
    type: String,
    default: 'An unexpected error occurred.'
  }
})

const emit = defineEmits(['close'])

function handleClose() {
  logger.action('Error modal closed')
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-backdrop" @click.self="handleClose">
      <div class="modal-content error-modal animate-slide-in">
        <div class="modal-header">
          <div class="error-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h2 class="modal-title">{{ title }}</h2>
          <button class="close-btn" @click="handleClose">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p class="error-message">{{ message }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="handleClose">
            OK
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.error-modal {
  width: 400px;
  max-width: 90vw;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
}

.error-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-error) 15%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-error);
}

.modal-title {
  flex: 1;
  margin: 0;
  font-size: 1.125rem;
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

.modal-body {
  padding: 24px;
}

.error-message {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  line-height: 1.6;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-tertiary);
  border-radius: 0 0 16px 16px;
}
</style>

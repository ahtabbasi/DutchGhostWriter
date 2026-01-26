<script setup>
import { ref } from 'vue'
import { setHidePopupWarning } from '../../services/storage'

defineProps({
  show: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close'])

const doNotShowAgain = ref(false)

function handleClose() {
  if (doNotShowAgain.value) {
    setHidePopupWarning(true)
  }
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-backdrop" @click.self="handleClose">
      <div class="modal-content popup-dialog">
        <div class="dialog-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <rect x="7" y="7" width="10" height="10" rx="1" ry="1"></rect>
            <line x1="17" y1="7" x2="20" y2="4"></line>
          </svg>
        </div>
        
        <h3 class="dialog-title">Enable Popups for Translations</h3>
        
        <p class="dialog-message">
          Please make sure you have enabled popups for this website to view the translation in a popup window.
        </p>
        
        <div class="dialog-hint">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span>If blocked, look for a popup icon in your browser's address bar</span>
        </div>
        
        <label class="do-not-show-checkbox">
          <input type="checkbox" v-model="doNotShowAgain" />
          <span>Do not show this again</span>
        </label>
        
        <button class="btn btn-primary dialog-btn" @click="handleClose">
          Got it
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.popup-dialog {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  text-align: center;
}

.dialog-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  border-radius: 50%;
  background: var(--color-accent-light);
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-title {
  margin: 0 0 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.dialog-message {
  margin: 0 0 1rem;
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  line-height: 1.6;
}

.dialog-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--color-bg-tertiary);
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.dialog-hint svg {
  flex-shrink: 0;
}

.do-not-show-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.do-not-show-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--color-accent);
  cursor: pointer;
}

.dialog-btn {
  width: 100%;
  padding: 0.75rem 1.5rem;
}
</style>

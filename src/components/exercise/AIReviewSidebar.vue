<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useTranslationsStore } from '../../stores/translations'
import { shouldHidePopupWarning } from '../../services/storage'
import TranslatePopupDialog from './TranslatePopupDialog.vue'
import logger from '../../services/logger'

const translationsStore = useTranslationsStore()

const showPopupDialog = ref(false)

const isOpen = computed(() => translationsStore.reviewSentenceId !== null)
const isLoading = computed(() => translationsStore.isReviewLoading)
const error = computed(() => translationsStore.reviewError)
const sentence = computed(() => translationsStore.currentReviewSentence)
const reviewContent = computed(() => translationsStore.currentReviewContent)

// Find the index of the sentence being reviewed
const sentenceIndex = computed(() => {
  if (!sentence.value || !translationsStore.currentTranslation) return -1
  return translationsStore.currentTranslation.sentences.findIndex(
    s => s.id === sentence.value.id
  )
})

// When the sidebar opens for a sentence without cached review, request one
watch(isOpen, (open) => {
  if (open && !reviewContent.value && !isLoading.value && !error.value) {
    translationsStore.requestReview()
  }
})

// When switching to a different sentence while sidebar is open
watch(() => translationsStore.reviewSentenceId, (newId, oldId) => {
  if (newId && newId !== oldId && !reviewContent.value && !isLoading.value) {
    translationsStore.requestReview()
  }
})

function handleClose() {
  logger.action('Closing AI review sidebar')
  translationsStore.closeReview()
}

function handleRetry() {
  logger.action('Retrying AI review request')
  translationsStore.requestReview()
}

function handleKeydown(event) {
  if (event.key === 'Escape' && isOpen.value) {
    handleClose()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

/**
 * Build a simple prompt for ChatGPT
 */
function buildChatGPTPrompt() {
  if (!sentence.value) return ''
  
  return `Review my English to Dutch translation:

English: ${sentence.value.english}
My translation: ${sentence.value.dutch}`
}

/**
 * Open ChatGPT with the review prompt
 */
function handleChatGPT() {
  if (!sentence.value) return
  
  logger.action('Opening ChatGPT for translation review')
  
  // Show popup warning dialog if not hidden
  if (!shouldHidePopupWarning()) {
    showPopupDialog.value = true
  }
  
  const prompt = buildChatGPTPrompt()
  const encodedPrompt = encodeURIComponent(prompt)
  const url = `https://chat.openai.com/?q=${encodedPrompt}`
  
  const width = 800
  const height = 700
  const left = window.screenX + (window.outerWidth - width) / 2
  const top = window.screenY + (window.outerHeight - height) / 2
  
  window.open(
    url,
    'ChatGPT',
    `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
  )
}

/**
 * Simple markdown to HTML converter
 */
function renderMarkdown(text) {
  if (!text) return ''
  
  let html = text
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Blockquotes (note: > is escaped to &gt; above)
    .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italics
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bullet points
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Wrap consecutive li elements in ul
    .replace(/(<li>.+<\/li>\n?)+/g, '<ul>$&</ul>')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p>')
    // Single newlines within paragraphs
    .replace(/\n/g, '<br>')
    // Remove <br> after block elements (they create their own line breaks)
    .replace(/<\/(h[1-6]|blockquote|ul)><br>/g, '</$1>')
  
  // Wrap in paragraph if not starting with block element
  if (!html.startsWith('<h') && !html.startsWith('<ul') && !html.startsWith('<blockquote')) {
    html = '<p>' + html + '</p>'
  }
  
  return html
}
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div 
        v-if="isOpen" 
        class="sidebar-backdrop"
        @click="handleClose"
      ></div>
    </Transition>

    <!-- Sidebar -->
    <Transition name="slide">
      <div v-if="isOpen" class="review-sidebar">
        <!-- Header -->
        <div class="sidebar-header">
          <div class="header-content">
            <div class="header-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                <path d="M20 3v4"/>
                <path d="M22 5h-4"/>
              </svg>
            </div>
            <div>
              <h2 class="header-title">AI Review</h2>
              <p class="header-subtitle" v-if="sentenceIndex >= 0">Sentence #{{ sentenceIndex + 1 }}</p>
            </div>
          </div>
          <div class="header-actions">
            <button 
              class="chatgpt-btn" 
              @click="handleChatGPT" 
              title="Open in ChatGPT"
              :disabled="!sentence"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
              </svg>
              <span>ChatGPT</span>
            </button>
            <button class="close-btn" @click="handleClose" title="Close">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Sentence being reviewed -->
        <div class="sentence-preview" v-if="sentence">
          <div class="preview-row">
            <span class="preview-label">English:</span>
            <span class="preview-text">{{ sentence.english }}</span>
          </div>
          <div class="preview-row">
            <span class="preview-label">Your translation:</span>
            <span class="preview-text dutch">{{ sentence.dutch }}</span>
          </div>
        </div>

        <!-- Content area -->
        <div class="sidebar-content">
          <!-- Loading state with skeleton -->
          <div v-if="isLoading" class="skeleton-container">
            <div class="skeleton-header">
              <div class="skeleton skeleton-title"></div>
            </div>
            <div class="skeleton skeleton-line"></div>
            <div class="skeleton skeleton-line short"></div>
            <div class="skeleton skeleton-line"></div>
            
            <div class="skeleton-header">
              <div class="skeleton skeleton-title"></div>
            </div>
            <div class="skeleton skeleton-line"></div>
            <div class="skeleton skeleton-line medium"></div>
            
            <div class="skeleton-header">
              <div class="skeleton skeleton-title"></div>
            </div>
            <div class="skeleton skeleton-blockquote"></div>
            
            <div class="skeleton-header">
              <div class="skeleton skeleton-title"></div>
            </div>
            <div class="skeleton skeleton-line medium"></div>
          </div>

          <!-- Error state -->
          <div v-else-if="error" class="error-container">
            <div class="error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <p class="error-message">{{ error }}</p>
            <button class="btn btn-primary retry-btn" @click="handleRetry">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              Retry
            </button>
            <div class="error-alternative">
              <span class="alternative-text">or</span>
              <button class="btn btn-secondary chatgpt-error-btn" @click="handleChatGPT">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
                </svg>
                Use ChatGPT
              </button>
            </div>
          </div>

          <!-- Review content -->
          <div 
            v-else-if="reviewContent" 
            class="review-content markdown-body"
            v-html="renderMarkdown(reviewContent)"
          ></div>
        </div>
      </div>
    </Transition>

    <!-- Popup Warning Dialog -->
    <TranslatePopupDialog 
      :show="showPopupDialog" 
      @close="showPopupDialog = false" 
    />
  </Teleport>
</template>

<style scoped>
.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
  z-index: 100;
}

.review-sidebar {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 420px;
  max-width: 100vw;
  background: var(--color-bg-secondary);
  box-shadow: var(--shadow-xl);
  z-index: 101;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--color-border);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

/* Header */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-tertiary);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--gradient-accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.header-subtitle {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin: 2px 0 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chatgpt-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 8px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  font-size: 0.6875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.chatgpt-btn svg {
  width: 14px;
  height: 14px;
}

.chatgpt-btn:hover:not(:disabled) {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  border-color: var(--color-text-muted);
}

.chatgpt-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.chatgpt-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
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
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

/* Sentence preview */
.sentence-preview {
  padding: 16px 24px;
  background: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border);
}

.preview-row {
  margin-bottom: 8px;
}

.preview-row:last-child {
  margin-bottom: 0;
}

.preview-label {
  display: block;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}

.preview-text {
  display: block;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  line-height: 1.5;
}

.preview-text.dutch {
  color: var(--color-accent);
  font-weight: 500;
}

/* Content area */
.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

/* Skeleton loader */
.skeleton-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-tertiary) 25%,
    var(--color-bg-primary) 50%,
    var(--color-bg-tertiary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-header {
  margin-top: 8px;
}

.skeleton-title {
  height: 24px;
  width: 45%;
}

.skeleton-line {
  height: 16px;
  width: 100%;
}

.skeleton-line.short {
  width: 60%;
}

.skeleton-line.medium {
  width: 80%;
}

.skeleton-blockquote {
  height: 48px;
  width: 100%;
  border-left: 3px solid var(--color-accent-light);
  margin-left: 0;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Error state */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 24px;
  gap: 16px;
}

.error-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-error) 15%, transparent);
  color: var(--color-error);
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-message {
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  margin: 0;
  max-width: 280px;
}

.retry-btn {
  margin-top: 8px;
}

.error-alternative {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}

.alternative-text {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}

.chatgpt-error-btn {
  gap: 6px;
}

/* Markdown content styles */
.markdown-body {
  font-size: 0.9375rem;
  line-height: 1.7;
  color: var(--color-text-primary);
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3) {
  color: var(--color-text-primary);
  font-weight: 600;
  margin-top: 24px;
  margin-bottom: 12px;
}

.markdown-body :deep(h1):first-child,
.markdown-body :deep(h2):first-child,
.markdown-body :deep(h3):first-child {
  margin-top: 0;
}

.markdown-body :deep(h1) {
  font-size: 1.375rem;
}

.markdown-body :deep(h2) {
  font-size: 1.125rem;
}

.markdown-body :deep(h3) {
  font-size: 1rem;
  color: var(--color-accent);
}

.markdown-body :deep(p) {
  margin: 0 0 16px;
}

.markdown-body :deep(p):last-child {
  margin-bottom: 0;
}

.markdown-body :deep(strong) {
  font-weight: 600;
  color: var(--color-text-primary);
}

.markdown-body :deep(em) {
  font-style: italic;
  color: var(--color-text-secondary);
}

.markdown-body :deep(code) {
  background: var(--color-bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.8125rem;
  color: var(--color-accent);
}

.markdown-body :deep(blockquote) {
  margin: 16px 0;
  padding: 12px 16px;
  background: var(--color-accent-light);
  border-left: 4px solid var(--color-accent);
  border-radius: 0 8px 8px 0;
  color: var(--color-text-primary);
  font-weight: 500;
}

.markdown-body :deep(ul) {
  margin: 12px 0;
  padding-left: 0;
  list-style: none;
}

.markdown-body :deep(li) {
  position: relative;
  padding-left: 20px;
  margin-bottom: 8px;
}

.markdown-body :deep(li)::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--color-accent);
  font-weight: bold;
}

.markdown-body :deep(li):last-child {
  margin-bottom: 0;
}
</style>

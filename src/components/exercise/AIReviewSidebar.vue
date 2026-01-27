<script setup>
import { computed, watch } from 'vue'
import { useTranslationsStore } from '../../stores/translations'

const translationsStore = useTranslationsStore()

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
  translationsStore.closeReview()
}

function handleRetry() {
  translationsStore.requestReview()
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
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
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
          <button class="close-btn" @click="handleClose" title="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
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

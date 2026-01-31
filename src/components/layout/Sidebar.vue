<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTranslationsStore } from '../../stores/translations'
import { useTheme } from '../../composables/useTheme'
import logger from '../../services/logger'

const router = useRouter()
const route = useRoute()
const translationsStore = useTranslationsStore()
const { isDark, toggleTheme } = useTheme()

const isCollapsed = ref(false)
const editingId = ref(null)
const editingTitle = ref('')
const showDeleteConfirm = ref(null)

const translations = computed(() => translationsStore.translations)

function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value
  logger.action(`Sidebar ${isCollapsed.value ? 'collapsed' : 'expanded'}`)
}

function goHome() {
  logger.action('Navigating to home')
  router.push({ name: 'home' })
}

function goToSettings() {
  logger.action('Navigating to settings')
  router.push({ name: 'settings' })
}

function openTranslation(id) {
  logger.action(`Opening translation: ${id}`)
  router.push({ name: 'exercise', params: { id } })
}

function startRename(translation) {
  editingId.value = translation.id
  editingTitle.value = translation.title
  logger.action(`Starting rename for translation: ${translation.id}`)
}

async function saveRename() {
  if (editingId.value && editingTitle.value.trim()) {
    await translationsStore.renameTranslation(editingId.value, editingTitle.value.trim())
  }
  editingId.value = null
  editingTitle.value = ''
}

function cancelRename() {
  editingId.value = null
  editingTitle.value = ''
}

function confirmDelete(id) {
  showDeleteConfirm.value = id
}

async function deleteTranslation(id) {
  await translationsStore.removeTranslation(id)
  showDeleteConfirm.value = null
  
  // If we were viewing this translation, go home
  if (route.params.id === String(id)) {
    router.push({ name: 'home' })
  }
}

function cancelDelete() {
  showDeleteConfirm.value = null
}

function isActive(id) {
  return route.params.id === String(id)
}

/**
 * Get translation status based on completed sentences
 * @returns 'new' | 'in-progress' | 'completed'
 */
function getTranslationStatus(translation) {
  const sentences = translation.sentences || []
  if (sentences.length === 0) return 'new'
  
  const translatedCount = sentences.filter(s => s.dutch && s.dutch.trim()).length
  
  if (translatedCount === 0) return 'new'
  if (translatedCount === sentences.length) return 'completed'
  return 'in-progress'
}
</script>

<template>
  <aside 
    class="sidebar"
    :class="{ 'sidebar-collapsed': isCollapsed }"
  >
    <!-- Toggle button -->
    <button 
      class="sidebar-toggle"
      @click="toggleSidebar"
      :title="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
    >
      <svg v-if="isCollapsed" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </button>

    <div v-show="!isCollapsed" class="sidebar-content">
      <!-- Header -->
      <div class="sidebar-header">
        <button class="app-title" @click="goHome" title="Go to Home">
          <span class="title-icon">🇳🇱</span>
          <span class="title-text">Dutch GhostWriter</span>
        </button>
      </div>

      <!-- Actions -->
      <div class="sidebar-actions">
        <button class="btn btn-primary w-full" @click="goHome">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Translation
        </button>
      </div>

      <!-- Translations List -->
      <div class="translations-list">
        <h2 class="list-title">Your Translations</h2>
        
        <div v-if="translations.length === 0" class="empty-list">
          <p>No translations yet.</p>
          <p class="text-muted">Create your first translation to get started!</p>
        </div>

        <div v-else class="list-items">
          <div 
            v-for="translation in translations" 
            :key="translation.id"
            class="translation-item"
            :class="{ 'active': isActive(translation.id) }"
          >
            <!-- Rename mode -->
            <div v-if="editingId === translation.id" class="rename-form">
              <input 
                v-model="editingTitle"
                class="input input-sm"
                @keyup.enter="saveRename"
                @keyup.escape="cancelRename"
                ref="renameInput"
                autofocus
              />
              <div class="rename-actions">
                <button class="btn-icon" @click="saveRename" title="Save">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </button>
                <button class="btn-icon" @click="cancelRename" title="Cancel">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Normal view -->
            <template v-else>
              <button 
                class="item-content"
                @click="openTranslation(translation.id)"
              >
                <span class="item-title-row">
                  <span 
                    class="status-icon"
                    :class="`status-${getTranslationStatus(translation)}`"
                    :title="getTranslationStatus(translation) === 'new' ? 'New' : getTranslationStatus(translation) === 'in-progress' ? 'In Progress' : 'Completed'"
                  >
                    <!-- New: Empty notepad icon -->
                    <svg v-if="getTranslationStatus(translation) === 'new'" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <!-- In Progress: Notepad with pencil icon -->
                    <svg v-else-if="getTranslationStatus(translation) === 'in-progress'" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    <!-- Completed: Bold checkmark -->
                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="4 12 9 17 20 6"/>
                    </svg>
                  </span>
                  <span class="item-title">{{ translation.title }}</span>
                </span>
                <span class="item-date">{{ new Date(translation.updatedAt).toLocaleDateString() }}</span>
              </button>
              <div class="item-actions">
                <button class="btn-icon" @click.stop="startRename(translation)" title="Rename">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                  </svg>
                </button>
                <button class="btn-icon btn-icon-danger" @click.stop="confirmDelete(translation.id)" title="Delete">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="sidebar-footer">
        <button class="footer-btn" @click="toggleTheme" :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
          <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </button>
        <button class="footer-btn" @click="goToSettings" title="Settings">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- Collapsed state icons -->
    <div v-show="isCollapsed" class="sidebar-collapsed-icons">
      <!-- Hamburger menu at top -->
      <button class="collapsed-icon hamburger-btn" @click="toggleSidebar" title="Expand sidebar">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      
      <!-- New translation button -->
      <button class="collapsed-icon new-btn" @click="goHome" title="New Translation">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      <!-- Spacer to push bottom icons down -->
      <div class="collapsed-spacer"></div>

      <!-- Bottom icons (dark mode + settings) -->
      <button class="collapsed-icon" @click="toggleTheme" :title="isDark ? 'Light mode' : 'Dark mode'">
        <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      </button>
      <button class="collapsed-icon" @click="goToSettings" title="Settings">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>
    </div>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showDeleteConfirm !== null" class="modal-backdrop" @click.self="cancelDelete">
        <div class="modal-content delete-modal animate-slide-in">
          <div class="delete-modal-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </div>
          <h3 class="delete-modal-title">Delete Translation?</h3>
          <p class="delete-modal-message">This action cannot be undone. The translation will be permanently deleted.</p>
          <div class="delete-modal-actions">
            <button class="btn btn-secondary" @click="cancelDelete">Cancel</button>
            <button class="btn btn-danger" @click="deleteTranslation(showDeleteConfirm)">Delete</button>
          </div>
        </div>
      </div>
    </Teleport>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 280px;
  min-width: 280px;
  height: 100vh;
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  transition: width 0.3s ease, min-width 0.3s ease;
}

.sidebar-collapsed {
  width: 60px;
  min-width: 60px;
}

.sidebar-toggle {
  position: absolute;
  top: 16px;
  right: -12px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.sidebar-toggle:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  overflow: hidden;
}

.sidebar-header {
  margin-bottom: 20px;
}

.app-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.app-title:hover {
  opacity: 0.8;
}

.title-icon {
  font-size: 1.5rem;
}

.sidebar-actions {
  margin-bottom: 24px;
}

.w-full {
  width: 100%;
}

.translations-list {
  flex: 1;
  overflow-y: auto;
  margin: 0 -16px;
  padding: 0 16px;
}

.list-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  margin-bottom: 12px;
}

.empty-list {
  text-align: center;
  padding: 24px 0;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.text-muted {
  color: var(--color-text-muted);
  font-size: 0.75rem;
  margin-top: 4px;
}

.list-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.translation-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
  position: relative;
}

.translation-item:hover {
  background: var(--color-bg-tertiary);
}

.translation-item.active {
  background: var(--color-accent-light);
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-align: left;
  color: inherit;
}

.item-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-new,
.status-in-progress,
.status-completed {
  color: var(--color-accent);
}

.item-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 140px;
}

.item-date {
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.item-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.translation-item:hover .item-actions {
  opacity: 1;
}

.btn-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.btn-icon-danger:hover {
  background: var(--color-error);
  color: white;
}


.rename-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-sm {
  padding: 6px 10px;
  font-size: 0.875rem;
}

.rename-actions {
  display: flex;
  gap: 4px;
}

.sidebar-footer {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
  margin-top: auto;
}

.footer-btn {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: none;
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.footer-btn:hover {
  background: var(--color-border);
  color: var(--color-text-primary);
}

.sidebar-collapsed-icons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  height: 100%;
}

.collapsed-spacer {
  flex: 1;
}

.collapsed-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.collapsed-icon:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.collapsed-icon.hamburger-btn {
  background: transparent;
  color: var(--color-text-secondary);
}

.collapsed-icon.hamburger-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.collapsed-icon.new-btn {
  background: var(--gradient-accent);
  color: white;
}

.collapsed-icon.new-btn:hover {
  opacity: 0.9;
}

/* Delete Modal */
.delete-modal {
  width: 380px;
  padding: 32px;
  text-align: center;
}

.delete-modal-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--color-error) 15%, transparent);
  color: var(--color-error);
}

.delete-modal-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 8px;
}

.delete-modal-message {
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  margin: 0 0 24px;
}

.delete-modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>

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
        <h1 class="app-title">
          <span class="title-icon">🇳🇱</span>
          <span class="title-text">Dutch GhostWriter</span>
        </h1>
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
            <!-- Delete confirmation overlay -->
            <div v-if="showDeleteConfirm === translation.id" class="delete-confirm">
              <p>Delete this translation?</p>
              <div class="confirm-actions">
                <button class="btn btn-danger btn-sm" @click="deleteTranslation(translation.id)">Delete</button>
                <button class="btn btn-secondary btn-sm" @click="cancelDelete">Cancel</button>
              </div>
            </div>

            <!-- Rename mode -->
            <div v-else-if="editingId === translation.id" class="rename-form">
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
                <span class="item-title">{{ translation.title }}</span>
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
      <button class="collapsed-icon" @click="goHome" title="New Translation">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
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
  position: relative;
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

.item-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 160px;
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

.delete-confirm {
  position: absolute;
  inset: 0;
  background: var(--color-bg-secondary);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid var(--color-border);
  z-index: 5;
}

.delete-confirm p {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.confirm-actions {
  display: flex;
  gap: 8px;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 0.75rem;
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
  gap: 16px;
  padding: 60px 0 16px;
  height: 100%;
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

.collapsed-icon:first-child {
  background: var(--gradient-accent);
  color: white;
}

.collapsed-icon:first-child:hover {
  opacity: 0.9;
}
</style>

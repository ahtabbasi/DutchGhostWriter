/**
 * Vue Router configuration with navigation guards
 */

import { createRouter, createWebHistory } from 'vue-router'
import { useSettingsStore } from '../stores/settings'
import logger from '../services/logger'

// Views
import SetupView from '../views/SetupView.vue'
import HomeView from '../views/HomeView.vue'
import ExerciseView from '../views/ExerciseView.vue'
import SettingsView from '../views/SettingsView.vue'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/setup',
    name: 'setup',
    component: SetupView,
    meta: { requiresAuth: false }
  },
  {
    path: '/home',
    name: 'home',
    component: HomeView,
    meta: { requiresAuth: true }
  },
  {
    path: '/exercise/:id',
    name: 'exercise',
    component: ExerciseView,
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/home'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Navigation guard to check for API key
router.beforeEach((to, from, next) => {
  const settingsStore = useSettingsStore()
  
  // Initialize settings if not done
  if (!settingsStore.isInitialized) {
    settingsStore.initialize()
  }
  
  const hasApiKey = settingsStore.hasApiKey
  const requiresAuth = to.meta.requiresAuth !== false
  
  logger.router(`Navigating to: ${to.name}`, { 
    hasApiKey, 
    requiresAuth,
    from: from.name 
  })
  
  // If route requires API key but user doesn't have one
  if (requiresAuth && !hasApiKey) {
    logger.router('Redirecting to setup - no API key')
    next({ name: 'setup' })
    return
  }
  
  // If user has API key and tries to access setup
  if (to.name === 'setup' && hasApiKey) {
    logger.router('Redirecting to home - already has API key')
    next({ name: 'home' })
    return
  }
  
  next()
})

export default router

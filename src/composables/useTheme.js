/**
 * Theme composable for dark/light mode toggle
 */

import { computed } from 'vue'
import { useSettingsStore } from '../stores/settings'

export function useTheme() {
  const settingsStore = useSettingsStore()

  const isDark = computed(() => settingsStore.isDarkMode)
  const theme = computed(() => settingsStore.theme)

  function toggleTheme() {
    settingsStore.toggleTheme()
  }

  function setTheme(themeName) {
    settingsStore.setTheme(themeName)
  }

  return {
    isDark,
    theme,
    toggleTheme,
    setTheme
  }
}

<script setup>
defineEmits(['add-text'])
</script>

<template>
  <div class="welcome-container">
    <div class="welcome-content animate-slide-in">
      <div class="welcome-icon">
        <span>🇳🇱</span>
      </div>
      <h1 class="welcome-title">Welcome to Dutch GhostWriter</h1>
      <p class="welcome-description">
        Practice your Dutch by translating English sentences. Add your own text or let AI generate content for you.
      </p>
      
      <div class="features">
        <div class="feature">
          <div class="feature-icon">📝</div>
          <div class="feature-text">
            <h3>Add Your Text</h3>
            <p>Paste any English text you want to translate</p>
          </div>
        </div>
        <div class="feature">
          <div class="feature-icon">🤖</div>
          <div class="feature-text">
            <h3>AI-Generated Content</h3>
            <p>Let Gemini create learning-focused text for you</p>
          </div>
        </div>
        <div class="feature">
          <div class="feature-icon">✏️</div>
          <div class="feature-text">
            <h3>Practice Translation</h3>
            <p>Translate each sentence and track your progress</p>
          </div>
        </div>
      </div>

      <button class="btn btn-primary btn-xl" @click="$emit('add-text')">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Add Text to Translate
      </button>
    </div>
  </div>
</template>

<style scoped>
.welcome-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 48px 24px;
}

.welcome-content {
  text-align: center;
  max-width: 600px;
}

.welcome-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.welcome-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 16px;
  background: var(--gradient-accent);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-description {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0 0 40px;
}

.features {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 40px;
}

.feature {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  text-align: left;
  padding: 16px 20px;
  background: var(--color-bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  transition: all 0.2s ease;
}

.feature:hover {
  border-color: var(--color-accent);
  transform: translateX(4px);
}

.feature-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.feature-text h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 4px;
}

.feature-text p {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.btn-xl {
  padding: 16px 32px;
  font-size: 1.125rem;
}
</style>

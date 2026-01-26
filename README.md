# Dutch GhostWriter 🇳🇱

A language learning web application to practice Dutch translations with AI-powered assistance.

## Features

- **AI-Powered Text Generation**: Generate English text using Google's Gemini 2.0 Flash API with preset topics or custom prompts
- **Translation Practice**: Translate English sentences to Dutch in an interactive table interface
- **Live Auto-Save**: All changes are saved automatically to your browser's local storage
- **Dark/Light Mode**: Toggle between dark and light themes
- **Offline-Ready**: All data is stored locally using IndexedDB

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Google Gemini API key ([Get one here](https://aistudio.google.com/apikey))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/DutchGhostWriter.git
cd DutchGhostWriter

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Deploying to GitHub Pages

```bash
npm run deploy
```

This will build the project and deploy it to the `gh-pages` branch.

## Usage

1. **Setup**: Enter your Gemini API key on first launch
2. **Add Text**: Click "Add Text to Translate" and either:
   - Paste your own English text
   - Use AI to generate text from preset topics or custom prompts
3. **Translate**: Practice translating each sentence to Dutch
4. **Manage**: Use the sidebar to navigate between translations, rename, or delete them

## Technology Stack

- **Frontend**: Vue.js 3 with Composition API
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4
- **State Management**: Pinia
- **Storage**: localStorage (settings) + IndexedDB (translations)
- **AI**: Google Gemini 2.0 Flash API

## Project Structure

```
src/
├── main.js                    # App entry point
├── App.vue                    # Root component
├── router/                    # Vue Router configuration
├── stores/                    # Pinia stores
├── services/                  # API and storage services
├── composables/               # Vue composables
├── components/                # UI components
│   ├── layout/               # Sidebar, ErrorModal
│   ├── setup/                # API key setup
│   ├── home/                 # Welcome message, TextDialog
│   └── exercise/             # Translation table components
├── views/                     # Page components
└── assets/                    # Styles and assets
```

## Configuration

### Settings

- **API Key**: Your Gemini API key (stored locally, never sent anywhere except Google's API)
- **Max Text Length**: Maximum characters for text input (100-5000)
- **Theme**: Light or dark mode

### Preset Topics for Text Generation

- Daily conversation
- Travel scenarios
- Food and dining
- Shopping
- Weather discussion

## Development

### Console Logging

The app includes detailed console logging for debugging:
- `[ACTION]` - User actions and their success/failure
- `[API]` - Gemini API calls
- `[STORAGE]` - IndexedDB and localStorage operations
- `[ROUTER]` - Navigation events
- `[ERROR]` - Errors with stack traces

### Local Storage

- Settings and API key are stored in `localStorage`
- Translations are stored in `IndexedDB` for better performance with larger data

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

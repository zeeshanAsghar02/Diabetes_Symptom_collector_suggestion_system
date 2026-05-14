// Fixed: removed embedded git repository and submodule config
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter/wght.css'
import './index.css'
import App from './App.jsx'
import { SettingsProvider } from './context/SettingsContext'
import { client } from './lib/appwrite'

client
  .ping()
  .then(() => console.log('✅ Appwrite ping OK'))
  .catch((err) => console.error('❌ Appwrite ping failed', err))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </StrictMode>,
)

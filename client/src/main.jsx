import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Dark mode detection - add 'dark' class to html element based on system preference
const updateDarkMode = () => {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// Initial check
updateDarkMode()

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateDarkMode)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)


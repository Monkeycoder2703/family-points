import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/fraunces/500.css'
import '@fontsource/fraunces/600.css'
import '@fontsource/fraunces/700.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/ibm-plex-mono/600.css'
import './index.css'
import App from './App.tsx'

// Zusätzliche Zoom-Sperre für Handys: Die viewport-Meta-Angabe allein
// ("user-scalable=no") wird von manchen modernen Browsern inzwischen
// ignoriert. Diese Listener blockieren Zwei-Finger-Zoom (Safari-Geste) und
// Doppeltipp-Zoom zusätzlich auf JavaScript-Ebene.
document.addEventListener('gesturestart', (e) => e.preventDefault())
document.addEventListener(
  'touchmove',
  (e) => {
    if (e.touches.length > 1) e.preventDefault()
  },
  { passive: false }
)
let lastTouchEnd = 0
document.addEventListener(
  'touchend',
  (e) => {
    const now = Date.now()
    if (now - lastTouchEnd <= 300) e.preventDefault()
    lastTouchEnd = now
  },
  { passive: false }
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

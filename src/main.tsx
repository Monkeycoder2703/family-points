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

// Zoom-Sperre für Handys, rein auf JavaScript-Ebene (siehe index.html: dort
// bewusst KEINE "maximum-scale"/"user-scalable=no" Angabe mehr, weil das bei
// manchen Android-Browsern - z. B. Samsung Internet - dazu führen kann, dass
// die Seite nach dem Schließen der Bildschirmtastatur verzerrt/verschoben
// hängen bleibt). Diese Listener blockieren stattdessen gezielt
// Zwei-Finger-Zoom und Doppeltipp-Zoom, ohne den Browser bei der
// Tastatur-Darstellung zu verwirren.
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

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/bebas-neue/400.css'
import '@fontsource/josefin-sans/400.css'
import '@fontsource/josefin-sans/600.css'
import '../cursor.css'
import './descent.css'
import DescentApp from './DescentApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DescentApp />
  </StrictMode>,
)

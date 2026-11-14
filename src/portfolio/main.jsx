import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/bebas-neue/400.css'
import '@fontsource/source-serif-4/400.css'
import '@fontsource/source-serif-4/400-italic.css'
import '@fontsource/source-serif-4/600.css'
import '../cursor.css'
import './portfolio.css'
import { Analytics } from '@vercel/analytics/react'
import PortfolioApp from './PortfolioApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PortfolioApp />
    <Analytics />
  </StrictMode>,
)

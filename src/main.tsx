import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './brand/tokens.css'
import './styles.css'
import './brand/look.css'
import './portfolio.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

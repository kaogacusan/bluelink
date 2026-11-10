import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './brand/tokens.css'
import './styles.css'
import './brand/look.css'
import './portfolio.css'
import App from './App'

// bluelinkph.com/admin and /admin/outreach open the admin pages.
const adminPath = location.pathname.match(/^\/admin(\/outreach)?\/?$/)
if (adminPath) history.replaceState(null, '', `/#/admin${adminPath[1] || ''}`)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

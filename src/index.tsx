import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '../index.css'
import App from './App.tsx'
import AdminApp from './admin/AdminApp.tsx'

const isSubdomainAdmin = window.location.hostname.startsWith('admin.');
const isPathAdmin = window.location.pathname.startsWith('/admin');
const isAdmin = isSubdomainAdmin || isPathAdmin;

if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={isPathAdmin ? '/admin' : undefined}>
      {isAdmin ? <AdminApp /> : <App />}
    </BrowserRouter>
  </StrictMode>,
)

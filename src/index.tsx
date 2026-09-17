import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '../index.css'
import App from './App.tsx'
import AdminApp from './admin/AdminApp.tsx'

const isAdmin = window.location.hostname.startsWith('admin.');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {isAdmin ? <AdminApp /> : <App />}
    </BrowserRouter>
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ReportProvider } from './context/ReportContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'
import './i18n.js'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ReportProvider>
          <App />
        </ReportProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

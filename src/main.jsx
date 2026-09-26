import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { lireThemeEnregistre } from './utils/themes'

// Applique le thème enregistré avant le premier affichage, pour éviter un flash du thème par défaut
document.documentElement.dataset.appTheme = lireThemeEnregistre()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

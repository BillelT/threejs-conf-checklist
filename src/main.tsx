import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import '@fontsource/syne/latin-800.css'
import '@fontsource/bebas-neue/latin-400.css'
import './styles/globals.css'

const root = createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

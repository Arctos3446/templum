import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Letras guardadas dentro de la app, para que funcionen sin internet.
import '@fontsource/jost/400.css'
import '@fontsource/jost/500.css'
import '@fontsource/jost/600.css'
import '@fontsource/cormorant-garamond/500.css'
import '@fontsource/cormorant-garamond/600.css'
import '@fontsource/cormorant-garamond/400-italic.css'
import '@fontsource/cormorant-garamond/500-italic.css'

import './styles/tokens.css'
import './styles/base.css'
import './styles/parte2.css'
import { App } from './App'
import { pedirAlmacenamientoPersistente } from './db/db'

pedirAlmacenamientoPersistente()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

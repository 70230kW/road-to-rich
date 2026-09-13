import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applySeasonalTheme } from './lib/seasonalTheme'

// index.html にも同内容のフラッシュ防止スクリプトがあるため、通常はここでの
// 適用は冪等な再適用になる（値は変わらない）。
applySeasonalTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

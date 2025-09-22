import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { enableMocking } from './api/mocks'

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
      <App />
  )
})

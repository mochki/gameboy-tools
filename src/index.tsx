import React from 'react'
import ReactDOM from 'react-dom/client'
import neu from './tools/neu'
import './global.module.css'
import App from './App'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

neu.init()

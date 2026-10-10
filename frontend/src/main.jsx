import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Admin from './screens/Admin.jsx'
import './styles.css'
import './install.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {location.pathname.startsWith('/admin') ? <Admin /> : <App />}
  </React.StrictMode>
)

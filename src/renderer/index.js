import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import '../i18n';

// Lade Entwicklungswerkzeuge nur im Development-Modus
if (process.env.NODE_ENV === 'development') {
  // Dynamischer Import für Entwicklungswerkzeuge
  import('./devtools.js')
    .then(() => console.log('Development tools loaded'))
    .catch(err => console.error('Failed to load development tools:', err));
}

// Create root for React
const container = document.getElementById('app');
const root = createRoot(container);

// Render the application
root.render(<App />); 
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './catalog-compact.css';
import './agenda-clean.css';
import {installAgendaDetailerBrand} from './agenda-detailer-brand';

installAgendaDetailerBrand();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

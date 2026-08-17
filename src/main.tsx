import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { I18nProvider } from './i18n';
import { AuthProvider } from './auth';
import './styles.css';
createRoot(document.getElementById('root')!).render(<StrictMode><I18nProvider><AuthProvider><App /></AuthProvider></I18nProvider></StrictMode>);

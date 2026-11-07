import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { StoreProvider } from '@/store/StoreContext';
// @ts-expect-error CSS is processed by the bundler and has no TypeScript declarations.
import './styles.css';

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root in index.html');

createRoot(container).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
);

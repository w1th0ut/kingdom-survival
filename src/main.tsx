import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { App } from './App';
import { AppPrivyProvider } from './components/PrivyProvider';
import { ErrorBoundary } from './components/ErrorBoundary';

const rootElement = document.getElementById('app');
if (!rootElement) throw new Error('Failed to find the root element');

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <ErrorBoundary>
      <AppPrivyProvider>
        <App />
      </AppPrivyProvider>
    </ErrorBoundary>
  </StrictMode>
);

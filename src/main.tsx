import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/react';
import App from './App.tsx';
import './index.css';
import { initAnalytics } from '@/lib/analytics';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={publishableKey}>
      <App />
    </ClerkProvider>
  </StrictMode>
);

// Analytics is loaded asynchronously and only after consent. Calling it here
// never blocks the initial render; it is also safe to call again from the
// consent banner without creating a second client.
void initAnalytics();

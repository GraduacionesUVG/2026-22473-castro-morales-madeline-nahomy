/** Punto de entrada de React: configura el cliente HTTP con la sesión y monta la aplicación. */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AppRouter } from './app/AppRouter'
import { ErrorBoundary } from './components/ui/ErrorBoundary/ErrorBoundary'
import { ErrorView } from './components/forms/ErrorView/ErrorView'
import { setAccessTokenProvider, setAuthFailureHandlers } from './services/api.client'
import { getValidAccessToken, handleUnauthorized, refreshSession } from './services/auth.service'

setAccessTokenProvider(getValidAccessToken)
setAuthFailureHandlers({
    onUnauthorized: handleUnauthorized,
    onForbidden: () => { void refreshSession() },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary
      fallback={() => <ErrorView onRetry={() => window.location.reload()} />}
    >
      <AppRouter />
    </ErrorBoundary>
  </StrictMode>,
)

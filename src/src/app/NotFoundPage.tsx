/** Página para rutas inexistentes que regresa a la ficha clínica. */

import { ErrorView } from '../components/forms/ErrorView/ErrorView'
import { ROUTES } from './routes'

export function NotFoundPage() {
    return (
        <ErrorView
            title="Página no encontrada"
            message="La dirección que abriste no existe o cambió de lugar."
            retryLabel="Ir al inicio"
            onRetry={() => { window.location.href = ROUTES.ficha }}
        />
    )
}

/** Redirección a la ruta solicitada antes de iniciar sesión en Keycloak. */

import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { prefersDashboard } from './permissions'
import { ROUTES } from '../../app/routes'

export function ReturnAfterLogin() {
    const { state, returnPath, consumeReturnPath } = useAuth()
    const navigate = useNavigate()
    const { pathname } = useLocation()

    const access = state.status === 'authenticated' ? state.access : null

    useEffect(() => {
        if (!returnPath) return

        const destino = returnPath === ROUTES.ficha && prefersDashboard(access)
            ? ROUTES.dashboard
            : returnPath

        consumeReturnPath()
        if (destino !== pathname) void navigate(destino, { replace: true })
    }, [returnPath, consumeReturnPath, navigate, pathname, access])

    return null
}

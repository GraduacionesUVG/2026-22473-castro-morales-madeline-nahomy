/** Definición centralizada de las rutas de la aplicación. */

export const ROUTES = {
    ficha: '/',

    dashboard:            '/dashboard',
    dashboardBusqueda:    '/dashboard/busqueda',
    dashboardFicha:       '/dashboard/busqueda/:fichaId',
    dashboardCie10:       '/dashboard/cie10',
    dashboardCie10Lote:   '/dashboard/cie10/:runId',
    dashboardReporteria:  '/dashboard/reporteria',
    dashboardAdendas:     '/dashboard/adendas',
    dashboardAdenda:      '/dashboard/adendas/:fichaId',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

export function dashboardChild(route: AppRoute): string {
    return route.slice(ROUTES.dashboard.length + 1)
}

export function fichaRoute(fichaId: string): string {
    return ROUTES.dashboardFicha.replace(':fichaId', encodeURIComponent(fichaId))
}

export function adendaRoute(fichaId: string): string {
    return ROUTES.dashboardAdenda.replace(':fichaId', encodeURIComponent(fichaId))
}

export function cie10LoteRoute(runId: string): string {
    return ROUTES.dashboardCie10Lote.replace(':runId', encodeURIComponent(runId))
}

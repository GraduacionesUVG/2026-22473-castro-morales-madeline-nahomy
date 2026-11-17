/** Permiso requerido por cada ruta del dashboard. */

import { ROUTES } from '../../app/routes'
import type { Permission } from '../auth/permissions'

type DashboardRoute = Exclude<(typeof ROUTES)[keyof typeof ROUTES], typeof ROUTES.ficha>

export const ROUTE_PERMISSIONS: Record<DashboardRoute, Permission> = {
    [ROUTES.dashboard]:           'dashboard',
    [ROUTES.dashboardBusqueda]:   'dashboard',
    [ROUTES.dashboardFicha]:      'dashboard',
    [ROUTES.dashboardCie10]:      'cie10.corregir',
    [ROUTES.dashboardCie10Lote]:  'cie10.corregir',
    [ROUTES.dashboardReporteria]: 'reporteria',
    [ROUTES.dashboardAdendas]:    'adendas.revisar',
    [ROUTES.dashboardAdenda]:     'adendas.revisar',
}

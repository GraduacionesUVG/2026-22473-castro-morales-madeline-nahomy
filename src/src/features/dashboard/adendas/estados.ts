/** Estados de una adenda y su relación con las pestañas de la bandeja. */

import type { EstadoAdenda } from '../../../services/ficha.service'
import type { StatusTone } from '../../../components/ui/StatusBadge/StatusBadge'

export type SlugEstado = 'pendientes' | 'aprobadas' | 'rechazadas'

export const ESTADO_POR_SLUG: Record<SlugEstado, EstadoAdenda> = {
    pendientes: 'PENDIENTE',
    aprobadas:  'APROBADA',
    rechazadas: 'RECHAZADA',
}

export const SLUG_POR_ESTADO: Record<EstadoAdenda, SlugEstado> = {
    PENDIENTE: 'pendientes',
    APROBADA:  'aprobadas',
    RECHAZADA: 'rechazadas',
}

export const TONO_POR_ESTADO: Record<EstadoAdenda, StatusTone> = {
    PENDIENTE: 'pending',
    APROBADA:  'approved',
    RECHAZADA: 'rejected',
}

export const TABS: { id: SlugEstado; label: string }[] = [
    { id: 'pendientes', label: 'Pendientes de revisar' },
    { id: 'aprobadas',  label: 'Aprobadas' },
    { id: 'rechazadas', label: 'Rechazadas' },
]

export function slugValido(valor: string | null): SlugEstado {
    return valor !== null && valor in ESTADO_POR_SLUG ? (valor as SlugEstado) : 'pendientes'
}

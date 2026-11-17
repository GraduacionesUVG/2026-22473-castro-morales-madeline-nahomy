/** Memoria de la última búsqueda de fichas durante la sesión de la pestaña. */

import type { DateRange } from '../../../components/ui/DateRangeField/DateRangeField'
import type { FichaResumen, FichaSearchParams } from '../../../types/ficha-search'

export interface BusquedaSnapshot {
    q: string
    rango: DateRange
    filtros: FichaSearchParams
    results: FichaResumen[]
    total: number
    page: number
}

let snapshot: BusquedaSnapshot | null = null

export function readBusquedaSnapshot(): BusquedaSnapshot | null {
    return snapshot
}

export function writeBusquedaSnapshot(next: BusquedaSnapshot): void {
    snapshot = next
}

export function clearBusquedaSnapshot(): void {
    snapshot = null
}

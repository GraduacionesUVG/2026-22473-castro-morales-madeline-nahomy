/** Servicio de búsqueda y lectura de fichas registradas del dashboard. */

import { apiFetch } from './api.client'
import { APP_ENV, USE_FICHA_SEARCH_MOCK } from '../config/runtime'
import type {
    FichaDetalle,
    FichaSearchParams,
    FichaSearchResult,
} from '../types/ficha-search'
import { getFichaByIdMock, searchFichasMock } from './fichaSearch.mock'

const USE_MOCK = USE_FICHA_SEARCH_MOCK
    ? ['1', 'true', 'yes', 'on'].includes(USE_FICHA_SEARCH_MOCK.trim().toLowerCase())
    : APP_ENV === 'test'

export const DEFAULT_PAGE_SIZE = 12

function buildQuery({ q, desde, hasta, page, pageSize }: FichaSearchParams): string {
    const params = new URLSearchParams()

    if (q?.trim()) params.set('q', q.trim())
    if (desde) params.set('desde', desde)
    if (hasta) params.set('hasta', hasta)
    params.set('page', String(page ?? 1))
    params.set('pageSize', String(pageSize ?? DEFAULT_PAGE_SIZE))

    return params.toString()
}

export async function searchFichas(params: FichaSearchParams = {}): Promise<FichaSearchResult> {
    if (USE_MOCK) return searchFichasMock(params)

    return apiFetch<FichaSearchResult>(`/v1/fichas?${buildQuery(params)}`, {
        sensitive: true,
        auth: 'bearer',
    })
}

export async function getFichaById(fichaId: string): Promise<FichaDetalle> {
    if (USE_MOCK) return getFichaByIdMock(fichaId)

    return apiFetch<FichaDetalle>(`/v1/fichas/${encodeURIComponent(fichaId)}`, {
        sensitive: true,
        auth: 'bearer',
    })
}

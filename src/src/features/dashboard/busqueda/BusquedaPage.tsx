/** Contenedor de la búsqueda de fichas: estado y llamadas al servicio. */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BusquedaView, type BusquedaStatus } from './BusquedaView'
import { isInvalidRange, type DateRange } from '../../../components/ui/DateRangeField/dateRange'
import { usePageHeader } from '../layout/usePageHeader'
import { fichaRoute } from '../../../app/routes'
import { DEFAULT_PAGE_SIZE, searchFichas } from '../../../services/fichaSearch.service'
import { ApiError } from '../../../services/api.client'
import { readBusquedaSnapshot, writeBusquedaSnapshot } from './busquedaCache'
import type { FichaResumen, FichaSearchParams } from '../../../types/ficha-search'

const RANGO_VACIO: DateRange = { desde: '', hasta: '' }

const MENSAJE_GENERICO = 'Intente de nuevo en un momento.'

function mensajeDeError(error: unknown): string {
    if (error instanceof ApiError) {
        if (error.status === 408) return 'La búsqueda tardó demasiado. Intente de nuevo.'
        if (error.status === 0)   return 'No hay conexión con el servidor.'
        if (error.status === 401 || error.status === 403) {
            return 'Su sesión no tiene permiso para consultar fichas.'
        }
    }
    return MENSAJE_GENERICO
}

export function BusquedaPage() {
    const navigate = useNavigate()
    usePageHeader('Búsqueda de Ficha Clínica')

    const [guardada] = useState(readBusquedaSnapshot)

    const [q, setQ] = useState(guardada?.q ?? '')
    const [rango, setRango] = useState<DateRange>(guardada?.rango ?? RANGO_VACIO)
    const [rangoError, setRangoError] = useState<string | undefined>()

    const [status, setStatus] = useState<BusquedaStatus>(guardada ? 'ready' : 'idle')
    const [results, setResults] = useState<FichaResumen[]>(guardada?.results ?? [])
    const [total, setTotal] = useState(guardada?.total ?? 0)
    const [page, setPage] = useState(guardada?.page ?? 1)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | undefined>()

    const filtrosAplicados = useRef<FichaSearchParams>(guardada?.filtros ?? {})

    const peticionActual = useRef(0)

    const ejecutarBusqueda = useCallback(async (filtros: FichaSearchParams) => {
        const idPeticion = ++peticionActual.current

        setStatus('loading')
        setErrorMessage(undefined)

        try {
            const resultado = await searchFichas(filtros)
            if (idPeticion !== peticionActual.current) return

            setResults(resultado.items)
            setTotal(resultado.total)
            setPage(resultado.page)
            setStatus('ready')
        } catch (error) {
            if (idPeticion !== peticionActual.current) return

            setErrorMessage(mensajeDeError(error))
            setStatus('error')
        }
    }, [])

    const handleSubmit = useCallback(() => {
        if (isInvalidRange(rango)) {
            setRangoError('La fecha inicial no puede ser posterior a la final.')
            return
        }
        setRangoError(undefined)

        const filtros: FichaSearchParams = {
            q: q.trim() || undefined,
            desde: rango.desde || undefined,
            hasta: rango.hasta || undefined,
            page: 1,
            pageSize: DEFAULT_PAGE_SIZE,
        }
        filtrosAplicados.current = filtros

        void ejecutarBusqueda(filtros)
    }, [ejecutarBusqueda, q, rango])

    const handleLoadMore = useCallback(async () => {
        const siguiente = page + 1
        const idPeticion = ++peticionActual.current

        setIsLoadingMore(true)

        try {
            const resultado = await searchFichas({ ...filtrosAplicados.current, page: siguiente })
            if (idPeticion !== peticionActual.current) return

            setResults((previas) => [...previas, ...resultado.items])
            setTotal(resultado.total)
            setPage(resultado.page)
        } catch (error) {
            if (idPeticion !== peticionActual.current) return

            setErrorMessage(mensajeDeError(error))
            setStatus('error')
        } finally {
            if (idPeticion === peticionActual.current) setIsLoadingMore(false)
        }
    }, [page])

    useEffect(() => {
        if (status !== 'ready') return

        writeBusquedaSnapshot({
            q,
            rango,
            filtros: filtrosAplicados.current,
            results,
            total,
            page,
        })
    }, [status, q, rango, results, total, page])

    const handleVerRegistro = useCallback(
        (fichaId: string) => navigate(fichaRoute(fichaId)),
        [navigate],
    )

    return (
        <BusquedaView
            q={q}
            onQChange={setQ}
            rango={rango}
            onRangoChange={(value) => {
                setRango(value)
                setRangoError(undefined)
            }}
            rangoError={rangoError}
            onSubmit={handleSubmit}
            status={status}
            results={results}
            total={total}
            errorMessage={errorMessage}
            hasMore={results.length < total}
            isLoadingMore={isLoadingMore}
            onLoadMore={() => void handleLoadMore()}
            onVerRegistro={handleVerRegistro}
        />
    )
}

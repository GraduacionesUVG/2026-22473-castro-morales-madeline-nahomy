/** Contenedor de la bandeja de adendas: estado y llamadas al servicio. */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AdendasView, type AdendasStatus } from './AdendasView'
import { isInvalidRange, type DateRange } from '../../../components/ui/DateRangeField/dateRange'
import { usePageHeader } from '../layout/usePageHeader'
import { adendaRoute } from '../../../app/routes'
import {
    ADENDAS_PAGE_SIZE,
    listarAdendas,
    type AdendaResumen,
    type AdendaSearchParams,
} from '../../../services/ficha.service'
import { ApiError } from '../../../services/api.client'
import { ESTADO_POR_SLUG, slugValido, type SlugEstado } from './estados'

const RANGO_VACIO: DateRange = { desde: '', hasta: '' }

function mensajeDeError(error: unknown): string {
    if (error instanceof ApiError) {
        if (error.status === 408) return 'La consulta tardó demasiado. Intente de nuevo.'
        if (error.status === 0)   return 'No hay conexión con el servidor.'
        if (error.status === 403 && error.code === 'SELF_REVIEW_FORBIDDEN') {
            return 'No puede resolver una adenda que usted mismo solicitó.'
        }
        if (error.status === 401 || error.status === 403) {
            return 'Su sesión no tiene permiso para revisar adendas.'
        }
    }
    return 'Intente de nuevo en un momento.'
}

export function AdendasPage() {
    usePageHeader('Corrección de Adendas')

    return <Bandeja />
}

interface FiltrosAplicados {
    q: string
    rango: DateRange
    intento: number
}

function Bandeja() {
    const navigate = useNavigate()
    const location = useLocation()
    const [searchParams, setSearchParams] = useSearchParams()

    const tab = slugValido(searchParams.get('estado'))

    const [q, setQ] = useState('')
    const [rango, setRango] = useState<DateRange>(RANGO_VACIO)
    const [rangoError, setRangoError] = useState<string | undefined>()

    const [aplicados, setAplicados] = useState<FiltrosAplicados>({
        q: '', rango: RANGO_VACIO, intento: 0,
    })

    const notice = (location.state as { notice?: string } | null)?.notice

    const filtros = useMemo<AdendaSearchParams>(() => ({
        estado: ESTADO_POR_SLUG[tab],
        q: aplicados.q.trim() || undefined,
        desde: aplicados.rango.desde || undefined,
        hasta: aplicados.rango.hasta || undefined,
        page: 1,
        pageSize: ADENDAS_PAGE_SIZE,
    }), [tab, aplicados])

    const handleSubmit = useCallback(() => {
        if (isInvalidRange(rango)) {
            setRangoError('La fecha inicial no puede ser posterior a la final.')
            return
        }
        setRangoError(undefined)
        setAplicados((previos) => ({ q, rango, intento: previos.intento + 1 }))
    }, [q, rango])

    const handleTabChange = useCallback((siguiente: SlugEstado) => {
        setSearchParams({ estado: siguiente }, { replace: true })
    }, [setSearchParams])

    const handleVerRegistro = useCallback(
        (fichaId: string) => navigate(adendaRoute(fichaId), { state: { estado: tab } }),
        [navigate, tab],
    )

    return (
        <Resultados
            key={`${tab}|${aplicados.q}|${aplicados.rango.desde}|${aplicados.rango.hasta}|${aplicados.intento}`}
            filtros={filtros}
            tab={tab}
            onTabChange={handleTabChange}
            q={q}
            onQChange={setQ}
            rango={rango}
            onRangoChange={(value) => {
                setRango(value)
                setRangoError(undefined)
            }}
            rangoError={rangoError}
            onSubmit={handleSubmit}
            onVerRegistro={handleVerRegistro}
            notice={notice}
        />
    )
}

interface ResultadosProps {
    filtros: AdendaSearchParams
    tab: SlugEstado
    onTabChange: (tab: SlugEstado) => void
    q: string
    onQChange: (value: string) => void
    rango: DateRange
    onRangoChange: (value: DateRange) => void
    rangoError?: string
    onSubmit: () => void
    onVerRegistro: (fichaId: string) => void
    notice?: string
}

function Resultados({ filtros, ...resto }: ResultadosProps) {
    const [status, setStatus] = useState<AdendasStatus>('loading')
    const [results, setResults] = useState<AdendaResumen[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | undefined>()

    const peticionActual = useRef(0)

    useEffect(() => {
        let vigente = true
        const idPeticion = ++peticionActual.current

        listarAdendas(filtros).then(
            (resultado) => {
                if (!vigente || idPeticion !== peticionActual.current) return
                setResults(resultado.items)
                setTotal(resultado.total)
                setPage(resultado.page)
                setStatus('ready')
            },
            (error: unknown) => {
                if (!vigente || idPeticion !== peticionActual.current) return
                setErrorMessage(mensajeDeError(error))
                setStatus('error')
            },
        )

        return () => { vigente = false }
    }, [filtros])

    const handleLoadMore = useCallback(async () => {
        const siguiente = page + 1
        const idPeticion = ++peticionActual.current

        setIsLoadingMore(true)

        try {
            const resultado = await listarAdendas({ ...filtros, page: siguiente })
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
    }, [filtros, page])

    return (
        <AdendasView
            {...resto}
            status={status}
            results={results}
            total={total}
            errorMessage={errorMessage}
            hasMore={results.length < total}
            isLoadingMore={isLoadingMore}
            onLoadMore={() => void handleLoadMore()}
        />
    )
}

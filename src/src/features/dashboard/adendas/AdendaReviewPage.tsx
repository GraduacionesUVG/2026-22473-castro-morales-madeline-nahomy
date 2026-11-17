/** Página de revisión de una adenda, cambio por cambio. */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { TriangleAlert } from 'lucide-react'
import { RegistrationOrchestratorView } from '../../../components/forms/RegistrationOrchestratorView/RegistrationOrchestratorView'
import { fichaItemAnchorId } from '../../../components/ui/MediaCard/anchor'
import { Button } from '../../../components/ui/Button/Button'
import { BackButton } from '../../../components/ui/BackButton/BackButton'
import { StatusBadge } from '../../../components/ui/StatusBadge/StatusBadge'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog/ConfirmDialog'
import { usePageHeader } from '../layout/usePageHeader'
import { useCatalogs } from '../../../hooks/useCatalogs'
import { fichaToView } from '../../patient/ficha.mapper'
import { ROUTES } from '../../../app/routes'
import { obtenerAdenda, resolverAdenda, type FichaDetail } from '../../../services/ficha.service'
import { ApiError } from '../../../services/api.client'
import { CambiosPanel } from './CambiosPanel'
import {
    cambiosDeAdenda,
    construirDecisiones,
    contarAprobados,
    decisionesCompletas,
    type CambioSolicitado,
    type Decision,
    type DecisionesPorCambio,
} from './cambios'
import { SLUG_POR_ESTADO, TONO_POR_ESTADO, slugValido, type SlugEstado } from './estados'
import styles from './AdendaReviewPage.module.css'

type Estado =
    | { status: 'loading' }
    | { status: 'ready'; ficha: FichaDetail }
    | { status: 'error'; message: string }

function mensajeDeError(error: unknown): string {
    if (error instanceof ApiError) {
        if (error.status === 404) return 'Esta adenda no existe o ya fue archivada.'
        if (error.status === 409) return 'Esta adenda ya fue resuelta por otra persona. Vuelva a la bandeja.'
        if (error.status === 408) return 'La consulta tardó demasiado.'
        if (error.status === 0)   return 'No hay conexión con el servidor.'
        if (error.status === 403 && error.code === 'SELF_REVIEW_FORBIDDEN') {
            return 'No puede resolver una adenda que usted mismo solicitó. Otro revisor debe hacerlo.'
        }
        if (error.status === 401 || error.status === 403) {
            return 'Su sesión no tiene permiso para revisar esta adenda.'
        }
    }
    return 'No se pudo completar la operación. Intente de nuevo en un momento.'
}

export function AdendaReviewPage() {
    const { fichaId } = useParams<{ fichaId: string }>()

    if (!fichaId) return <AdendaNoIndicada />

    return <Revision key={fichaId} fichaId={fichaId} />
}

function volverABandeja(tab: SlugEstado, notice?: string) {
    return {
        to: `${ROUTES.dashboardAdendas}?estado=${tab}`,
        options: notice ? { state: { notice } } : undefined,
    }
}

function AdendaNoIndicada() {
    const navigate = useNavigate()
    usePageHeader('Corrección de Adendas')

    return (
        <div className={styles.state} role="alert">
            <TriangleAlert size={40} className={styles.stateIcon} aria-hidden="true" />
            <span className={styles.stateTitle}>No se indicó qué adenda abrir</span>
            <div className={styles.stateActions}>
                <Button variant="primary" onClick={() => navigate(ROUTES.dashboardAdendas)}>
                    Volver a la bandeja
                </Button>
            </div>
        </div>
    )
}

function Revision({ fichaId }: { fichaId: string }) {
    const navigate = useNavigate()
    const location = useLocation()
    const catalogs = useCatalogs()

    const tabOrigen = slugValido((location.state as { estado?: string } | null)?.estado ?? null)

    const [estado, setEstado] = useState<Estado>({ status: 'loading' })
    const [intento, setIntento] = useState(0)

    const [decisiones, setDecisiones] = useState<DecisionesPorCambio>({})
    const [indice, setIndice] = useState(0)
    const [highlightedItemId, setHighlightedItemId] = useState<string | undefined>()

    const [guardando, setGuardando] = useState(false)
    const [errorGuardado, setErrorGuardado] = useState('')
    const [confirmarSalida, setConfirmarSalida] = useState(false)

    useEffect(() => {
        let vigente = true

        obtenerAdenda(fichaId).then(
            (ficha) => { if (vigente) setEstado({ status: 'ready', ficha }) },
            (error) => { if (vigente) setEstado({ status: 'error', message: mensajeDeError(error) }) },
        )

        return () => { vigente = false }
    }, [fichaId, intento])

    const cambios: CambioSolicitado[] = useMemo(
        () => (estado.status === 'ready' ? cambiosDeAdenda(estado.ficha) : []),
        [estado],
    )

    const hayDecisiones = Object.keys(decisiones).length > 0
    const resuelta = estado.status === 'ready' && (estado.ficha.estadoRevision ?? 'PENDIENTE') !== 'PENDIENTE'

    const salir = useCallback((notice?: string) => {
        const destino = volverABandeja(tabOrigen, notice)
        navigate(destino.to, destino.options)
    }, [navigate, tabOrigen])

    const handleCancelar = useCallback(() => {
        if (guardando) return
        if (hayDecisiones && !resuelta) {
            setConfirmarSalida(true)
            return
        }
        salir()
    }, [guardando, hayDecisiones, resuelta, salir])

    const botonRegresar = useMemo(() => (
        <BackButton onClick={handleCancelar} label="Regresar a la bandeja de adendas" />
    ), [handleCancelar])

    const nombre = estado.status === 'ready' ? estado.ficha.paciente.nombre : undefined
    usePageHeader('Corrección de adenda para paciente:', nombre, botonRegresar)

    const enfocarRegistro = useCallback((registroId: string) => {
        setHighlightedItemId(registroId)
        document.getElementById(fichaItemAnchorId(registroId))
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, [])

    useEffect(() => {
        if (!highlightedItemId) return
        const id = window.setTimeout(() => setHighlightedItemId(undefined), 2600)
        return () => window.clearTimeout(id)
    }, [highlightedItemId])

    const decidir = useCallback((id: string, decision: Decision) => {
        setErrorGuardado('')
        setDecisiones((previas) => ({ ...previas, [id]: decision }))
        setIndice((actual) => Math.min(actual + 1, cambios.length - 1))
    }, [cambios.length])

    const guardar = useCallback(async () => {
        if (guardando || !decisionesCompletas(cambios, decisiones)) return

        setGuardando(true)
        setErrorGuardado('')

        try {
            const payload = construirDecisiones(cambios, decisiones)
            await resolverAdenda(fichaId, payload)

            const aprobados = contarAprobados(payload)
            const estadoFinal = aprobados > 0 ? 'APROBADA' : 'RECHAZADA'
            const aviso = aprobados === payload.length
                ? 'Adenda aprobada. Los cambios ya forman parte de la ficha vigente.'
                : aprobados === 0
                ? 'Adenda rechazada. Se conserva la ficha vigente anterior.'
                : `Adenda resuelta: ${aprobados} de ${payload.length} cambios aplicados.`

            navigate(`${ROUTES.dashboardAdendas}?estado=${SLUG_POR_ESTADO[estadoFinal]}`, {
                replace: true,
                state: { notice: aviso },
            })
        } catch (error) {
            setErrorGuardado(mensajeDeError(error))
        } finally {
            setGuardando(false)
        }
    }, [cambios, decisiones, fichaId, guardando, navigate])

    if (estado.status === 'loading') {
        return (
            <div className={styles.skeletons} aria-busy="true" aria-label="Cargando la adenda">
                {Array.from({ length: 3 }, (_, index) => (
                    <div key={index} className={styles.skeleton} />
                ))}
            </div>
        )
    }

    if (estado.status === 'error') {
        return (
            <div className={styles.state} role="alert">
                <TriangleAlert size={40} className={styles.stateIcon} aria-hidden="true" />
                <span className={styles.stateTitle}>No se pudo abrir la adenda</span>
                <p className={styles.stateText}>{estado.message}</p>
                <div className={styles.stateActions}>
                    <Button variant="ghost" onClick={() => { setEstado({ status: 'loading' }); setIntento((n) => n + 1) }}>
                        Reintentar
                    </Button>
                    <Button variant="primary" onClick={() => salir()}>Volver a la bandeja</Button>
                </div>
            </div>
        )
    }

    const { ficha } = estado
    const estadoRevision = ficha.estadoRevision ?? 'PENDIENTE'
    const puedeGuardar = !resuelta && decisionesCompletas(cambios, decisiones)

    return (
        <div className={styles.page}>
            <p className={styles.subtitle}>
                Pediatra que lo solicita: <strong>{ficha.medico.nombre}</strong>
                <StatusBadge tone={TONO_POR_ESTADO[estadoRevision]} className={styles.subtitleBadge} />
            </p>

            <div className={styles.acciones}>
                <Button
                    variant="primary"
                    isLoading={guardando}
                    disabled={!puedeGuardar || guardando}
                    onClick={() => void guardar()}
                >
                    Guardar cambios
                </Button>
                <Button variant="ghost" disabled={guardando} onClick={handleCancelar}>
                    Cancelar
                </Button>
            </div>

            {errorGuardado && (
                <p className={styles.saveError} role="alert">{errorGuardado}</p>
            )}

            <div className={styles.columns}>
                <div className={styles.left}>
                    {cambios.length === 0 ? (
                        <p className={styles.sinCambios} role="status">
                            Esta adenda no trae cambios que revisar. Puede que ya se haya resuelto
                            desde otra sesión.
                        </p>
                    ) : (
                        <CambiosPanel
                            cambios={cambios}
                            indice={Math.min(indice, cambios.length - 1)}
                            onIndiceChange={setIndice}
                            decisiones={decisiones}
                            onDecidir={decidir}
                            onFocusRegistro={enfocarRegistro}
                            disabled={guardando || resuelta}
                        />
                    )}

                    {resuelta && (
                        <p className={styles.resuelta} role="status">
                            Esta adenda ya fue resuelta; se muestra solo para consulta.
                        </p>
                    )}
                </div>

                <div className={styles.right}>
                    <section className={styles.comment} aria-label="Comentario del pediatra">
                        <h2 className={styles.commentTitle}>Comentario del pediatra</h2>
                        <div className={styles.commentBody}>
                            {ficha.motivoSolicitud?.trim()
                                ? ficha.motivoSolicitud
                                : 'El pediatra no dejó un comentario general.'}
                        </div>
                    </section>

                    {catalogs.error && (
                        <p className={styles.catalogosCaidos} role="status">
                            No se pudieron cargar los catálogos: "Referido de" y "Lugar de parto"
                            se verán en blanco. El resto de la ficha está completa.
                        </p>
                    )}

                    <div className={styles.ficha}>
                        <RegistrationOrchestratorView
                            readOnly
                            {...fichaToView(ficha)}
                            mode="view"
                            highlightedItemId={highlightedItemId}
                            referidoDeOptions={catalogs.referidoDeOptions}
                            lugarDePartoOptions={catalogs.asistenciaPartoOptions}
                            sexoOptions={catalogs.sexoOptions}
                            familiarAfectadoGroups={catalogs.familiarGroups}
                            regionDefs={catalogs.regionDefs}
                        />
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={confirmarSalida}
                title="¿Está seguro de salir?"
                message="Se perderán las decisiones que lleva tomadas en esta adenda."
                confirmLabel="Sí, salir"
                onCancel={() => setConfirmarSalida(false)}
                onConfirm={() => salir()}
            />
        </div>
    )
}

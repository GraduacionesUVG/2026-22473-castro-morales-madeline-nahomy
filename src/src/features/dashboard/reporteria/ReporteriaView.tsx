/** Vista del dashboard de reportería. */

import { useRef, useState, type ReactNode } from 'react'
import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    pointerWithin,
    useSensor,
    useSensors,
    type Announcements,
    type CollisionDetection,
    type DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    rectSortingStrategy,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    type SortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Bot, GripVertical, Maximize2, Minimize2, X } from 'lucide-react'
import { Button } from '../../../components/ui/Button/Button'
import { InlineNotice } from '../../../components/ui/InlineNotice/InlineNotice'
import { Tabs } from '../../../components/ui/Tabs/Tabs'
import type { MonthlyItem, ReportingSummary, TopDiagnosticoItem } from '../../../services/reporting.service'
import { AgentChatPanel, type AgentChatPanelProps } from './AgentChatPanel'
import { GraficaAgente } from './AgentResultBlocks'
import { AgentResultTable } from './AgentResultTable'
import { ExportarTableroModal } from './ExportarTableroModal'
import { formatearNumero, ultimosMeses } from './formato'
import { HerramientasTablero } from './HerramientasTablero'
import { ImportarTableroModal } from './ImportarTableroModal'
import { KpiCard } from './KpiCard'
import { MonthlyChart } from './MonthlyChart'
import {
    DASHBOARD_IDS,
    distribuirFilas,
    esTabla,
    NOMBRE_DASHBOARD,
    type DashboardId,
    type Tablero,
    type Tableros,
    type WidgetAgente,
} from './tablero'
import { TopDiagnosticosChart } from './TopDiagnosticosChart'
import styles from './ReporteriaView.module.css'

export type Seccion<T> =
    | { status: 'loading' }
    | { status: 'error' }
    | { status: 'ready'; data: T }

const DASHBOARDS = DASHBOARD_IDS.map((id) => ({ id, label: NOMBRE_DASHBOARD[id] }))

const destinoDelPuntero: CollisionDetection = (args) => {
    const { pointerCoordinates } = args
    if (!pointerCoordinates) return closestCenter(args)
    const bajoElPuntero = pointerWithin(args)
    if (bajoElPuntero.length > 0) return bajoElPuntero
    const { x, y } = pointerCoordinates
    return closestCenter({
        ...args,
        collisionRect: { top: y, bottom: y, left: x, right: x, width: 0, height: 0 },
    })
}

const sinDesplazar: SortingStrategy = () => null

export interface ReporteriaViewProps {
    dashboard: DashboardId
    onDashboardChange: (dashboard: DashboardId) => void
    tablero: Tablero
    onReordenar: (orden: string[]) => void
    onQuitarWidget: (id: string) => void
    onAlternarAncho: (id: string) => void
    tarjetasPorTablero: Record<DashboardId, number>
    onExportar: () => void
    onImportar: (tableros: Tableros) => void
    onDescargarPdf: (elemento: HTMLElement) => void
    generandoPdf: boolean
    onBorrar: () => void

    resumen: Seccion<ReportingSummary>
    topDiagnosticos: Seccion<TopDiagnosticoItem[]>
    mensualSigsa: Seccion<MonthlyItem[]>
    mensualCongenia: Seccion<MonthlyItem[]>
    onReintentar: () => void

    chatAbierto: boolean
    onAbrirChat: () => void
    chat: AgentChatPanelProps
}

export function ReporteriaView({
    dashboard,
    onDashboardChange,
    tablero,
    onReordenar,
    onQuitarWidget,
    onAlternarAncho,
    tarjetasPorTablero,
    onExportar,
    onImportar,
    onDescargarPdf,
    generandoPdf,
    onBorrar,
    resumen,
    topDiagnosticos,
    mensualSigsa,
    mensualCongenia,
    onReintentar,
    chatAbierto,
    onAbrirChat,
    chat,
}: ReporteriaViewProps) {
    const tableroRef = useRef<HTMLElement>(null)
    const [modal, setModal] = useState<'exportar' | 'importar' | null>(null)

    const secciones = dashboard === 'produccion'
        ? [resumen, topDiagnosticos, mensualSigsa]
        : [resumen, mensualCongenia]
    const algunaFallo = secciones.some((seccion) => seccion.status === 'error')
    const algunaCarga = secciones.some((seccion) => seccion.status === 'loading')
    const filas = distribuirFilas(tablero)
    const tamanosDistintos = filas.aLoAncho.size > 0
        || Object.values(tablero.widgets).some((widget) => esTabla(widget.bloque))

    const fijas: Record<string, TarjetaProps> = {
        'produccion-mensual': {
            titulo: 'Registros por mes',
            subtitulo: 'Producción ambulatoria',
            children: (
                <SeccionCuerpo seccion={mensualSigsa} alto="chart">
                    {(items) => <MonthlyChart items={ultimosMeses(items)} serie="Registros" />}
                </SeccionCuerpo>
            ),
        },
        'produccion-top': {
            titulo: 'Diagnósticos más frecuentes',
            subtitulo: 'Top 10 de producción ambulatoria',
            children: (
                <SeccionCuerpo seccion={topDiagnosticos} alto="list">
                    {(items) => <TopDiagnosticosChart items={items} />}
                </SeccionCuerpo>
            ),
        },
        'ficha-mensual': {
            titulo: 'Fichas por mes',
            subtitulo: 'Ficha clínica',
            children: (
                <SeccionCuerpo seccion={mensualCongenia} alto="chart">
                    {(items) => <MonthlyChart items={ultimosMeses(items)} serie="Fichas" />}
                </SeccionCuerpo>
            ),
        },
    }

    const tarjeta = (id: string): TarjetaProps | null => {
        if (id in fijas) return fijas[id]
        const widget = tablero.widgets[id]
        return widget ? propsDeWidget(widget, () => onQuitarWidget(id)) : null
    }

    const titulo = (id: string) => tarjeta(id)?.titulo ?? 'la tarjeta'

    const sensores = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates, scrollBehavior: 'auto' }),
    )

    const alSoltar = ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id) return
        const desde = tablero.orden.indexOf(String(active.id))
        const hasta = tablero.orden.indexOf(String(over.id))
        if (desde < 0 || hasta < 0) return
        onReordenar(arrayMove(tablero.orden, desde, hasta))
    }

    const posicion = (id: string | number) => tablero.orden.indexOf(String(id)) + 1

    const anuncios: Announcements = {
        onDragStart: ({ active }) =>
            `Tomaste ${titulo(String(active.id))}. Está en la posición ${posicion(active.id)} de ${tablero.orden.length}.`,
        onDragOver: ({ active, over }) =>
            over ? `${titulo(String(active.id))} pasa a la posición ${posicion(over.id)}.` : undefined,
        onDragEnd: ({ active, over }) =>
            over
                ? `Soltaste ${titulo(String(active.id))} en la posición ${posicion(over.id)}.`
                : `Soltaste ${titulo(String(active.id))}.`,
        onDragCancel: ({ active }) => `Se canceló. ${titulo(String(active.id))} vuelve a su lugar.`,
    }

    return (
        <div className={chatAbierto ? `${styles.layout} ${styles.chatOpen}` : styles.layout}>
            <section ref={tableroRef} className={styles.board} aria-label="Indicadores de reportería">
                <div className={styles.toolbar}>
                    <Tabs
                        items={DASHBOARDS}
                        activeId={dashboard}
                        onChange={(id) => onDashboardChange(id as DashboardId)}
                        label="Dashboard de reportería"
                        variant="segmented"
                        className={styles.selector}
                    />

                    <HerramientasTablero
                        nombreTablero={NOMBRE_DASHBOARD[dashboard]}
                        tarjetasAgente={tarjetasPorTablero[dashboard]}
                        pdfDisponible={!algunaCarga}
                        generandoPdf={generandoPdf}
                        onExportar={() => setModal('exportar')}
                        onImportar={() => setModal('importar')}
                        onDescargarPdf={() => { if (tableroRef.current) onDescargarPdf(tableroRef.current) }}
                        onBorrar={onBorrar}
                    />
                </div>

                {algunaFallo && (
                    <div className={styles.alert}>
                        <InlineNotice tone="danger">
                            Parte de la reportería no se pudo cargar.
                        </InlineNotice>
                        <Button variant="secondary" size="sm" onClick={onReintentar}>Reintentar</Button>
                    </div>
                )}

                <div
                    role="tabpanel"
                    id={`panel-${dashboard}`}
                    aria-labelledby={`tab-${dashboard}`}
                    className={styles.panel}
                >
                    <div className={styles.kpis} data-pdf-kpis>
                        {dashboard === 'produccion'
                            ? <KpisProduccion resumen={resumen} />
                            : <KpisFicha resumen={resumen} />}
                    </div>

                    <DndContext
                        sensors={sensores}
                        collisionDetection={destinoDelPuntero}
                        onDragEnd={alSoltar}
                        accessibility={{
                            announcements: anuncios,
                            screenReaderInstructions: {
                                draggable: 'Para mover la tarjeta, pulsa Espacio, usa las flechas y vuelve a pulsar Espacio para soltarla. Escape cancela.',
                            },
                        }}
                    >
                        <SortableContext
                            items={tablero.orden}
                            strategy={tamanosDistintos ? sinDesplazar : rectSortingStrategy}
                        >
                            <div className={styles.charts}>
                                {tablero.orden.map((id) => {
                                    const props = tarjeta(id)
                                    return props && (
                                        <Tarjeta
                                            key={id}
                                            id={id}
                                            {...props}
                                            ancha={filas.aLoAncho.has(id)}
                                            onAlternarAncho={() => onAlternarAncho(id)}
                                        />
                                    )
                                })}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            </section>

            {chatAbierto ? (
                <AgentChatPanel {...chat} />
            ) : (
                <button
                    type="button"
                    className={styles.fab}
                    onClick={onAbrirChat}
                    aria-label="Abrir el agente de datos"
                    title="Agente de datos"
                >
                    <Bot size={28} aria-hidden="true" />
                </button>
            )}

            <ExportarTableroModal
                isOpen={modal === 'exportar'}
                onClose={() => setModal(null)}
                tarjetas={tarjetasPorTablero}
                onDescargar={() => {
                    onExportar()
                    setModal(null)
                }}
            />
            <ImportarTableroModal
                isOpen={modal === 'importar'}
                onClose={() => setModal(null)}
                onImportar={(tableros) => {
                    onImportar(tableros)
                    setModal(null)
                }}
            />
        </div>
    )
}

interface TarjetaProps {
    titulo: string
    subtitulo?: string
    onQuitar?: () => void
    tabla?: boolean
    children: ReactNode
}

function Tarjeta({ id, titulo, subtitulo, onQuitar, tabla, ancha, onAlternarAncho, children }: TarjetaProps & {
    id: string
    ancha: boolean
    onAlternarAncho: () => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
        isOver,
        active,
    } = useSortable({ id })

    const tituloId = `tarjeta-${id}`
    const clases = [
        styles.card,
        styles.tile,
        ancha ? styles.ancha : '',
        tabla ? styles.tileTabla : '',
        isDragging ? styles.dragging : '',
        isOver && active && !isDragging ? styles.destino : '',
    ].filter(Boolean).join(' ')

    return (
        <article
            ref={setNodeRef}
            style={{ transform: CSS.Translate.toString(transform), transition }}
            className={clases}
            aria-labelledby={tituloId}
            data-pdf-tarjeta={id}
        >
            <header className={styles.cardHeader}>
                <div className={styles.cardHeading}>
                    <h2 id={tituloId} className={styles.cardTitle}>{titulo}</h2>
                    {subtitulo && <p className={styles.cardSubtitle}>{subtitulo}</p>}
                </div>
                <div className={styles.cardActions} data-pdf-omitir>
                    <button
                        type="button"
                        className={`${styles.cardButton} ${styles.anchoButton}`}
                        onClick={onAlternarAncho}
                        aria-pressed={ancha}
                        aria-label={ancha ? `Volver «${titulo}» a media fila` : `Ensanchar «${titulo}» a toda la fila`}
                        title={ancha ? 'Volver a media fila' : 'Ensanchar a toda la fila'}
                    >
                        {ancha ? <Minimize2 size={16} aria-hidden="true" /> : <Maximize2 size={16} aria-hidden="true" />}
                    </button>
                    {onQuitar && (
                        <button
                            type="button"
                            className={styles.cardButton}
                            onClick={onQuitar}
                            aria-label={`Quitar «${titulo}» del tablero`}
                            title="Quitar del tablero"
                        >
                            <X size={16} aria-hidden="true" />
                        </button>
                    )}
                    <button
                        ref={setActivatorNodeRef}
                        type="button"
                        className={`${styles.cardButton} ${styles.handle}`}
                        {...attributes}
                        {...listeners}
                        aria-label={`Mover «${titulo}»`}
                        title="Arrastrar para mover"
                    >
                        <GripVertical size={16} aria-hidden="true" />
                    </button>
                </div>
            </header>
            <div className={styles.cardBody}>{children}</div>
        </article>
    )
}

function propsDeWidget(widget: WidgetAgente, onQuitar: () => void): TarjetaProps {
    const { bloque } = widget
    return {
        titulo: bloque.title,
        onQuitar,
        tabla: esTabla(bloque),
        children: esTabla(bloque)
            ? <AgentResultTable rows={bloque.rows} columns={bloque.columns} llenar />
            : <GraficaAgente block={bloque} className={styles.chart} />,
    }
}

function KpisProduccion({ resumen }: { resumen: Seccion<ReportingSummary> }) {
    if (resumen.status === 'loading') return <KpisCargando cantidad={2} />
    const datos = resumen.status === 'ready' ? resumen.data.sigsa : null

    return (
        <>
            <KpiCard
                label="Registros de producción ambulatoria"
                value={datos?.totalConsultas ?? null}
                detail={esteMes(datos?.consultasMesActual)}
            />
            <KpiCard
                label="Códigos CIE-10 distintos"
                value={datos?.codigosCie10 ?? null}
                detail={datos?.datasetVersion ? `Dataset ${datos.datasetVersion}` : undefined}
            />
        </>
    )
}

function KpisFicha({ resumen }: { resumen: Seccion<ReportingSummary> }) {
    if (resumen.status === 'loading') return <KpisCargando cantidad={1} />
    const datos = resumen.status === 'ready' ? resumen.data.congenia : null

    return (
        <KpiCard
            label="Fichas pediátricas genéticas"
            value={datos?.totalFichas ?? null}
            detail={esteMes(datos?.fichasMesActual)}
        />
    )
}

function esteMes(valor: number | undefined) {
    return valor == null ? undefined : `${formatearNumero(valor)} este mes`
}

function KpisCargando({ cantidad }: { cantidad: number }) {
    return (
        <>
            {Array.from({ length: cantidad }, (_, i) => (
                <div key={i} className={`${styles.skeleton} ${styles.skeletonKpi}`} />
            ))}
        </>
    )
}

function SeccionCuerpo<T>({
    seccion,
    alto,
    children,
}: {
    seccion: Seccion<T>
    alto: 'chart' | 'list'
    children: (data: T) => ReactNode
}) {
    if (seccion.status === 'loading') {
        return <div className={`${styles.skeleton} ${alto === 'chart' ? styles.skeletonChart : styles.skeletonList}`} />
    }
    if (seccion.status === 'error') {
        return <p className={styles.empty}>No disponible.</p>
    }
    return <>{children(seccion.data)}</>
}

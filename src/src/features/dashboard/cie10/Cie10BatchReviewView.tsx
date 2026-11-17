/** Tabla de revisión del lote CIE-10. */

import { useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { CircleAlert, CircleCheck, CircleX, Eraser, FileSearch, Info, Keyboard, Search, Settings, TriangleAlert, X } from 'lucide-react'
import { Button } from '../../../components/ui/Button/Button'
import { ConsentCard } from '../../../components/ui/ConsentCard/ConsentCard'
import { InlineNotice } from '../../../components/ui/InlineNotice/InlineNotice'
import { NumberStepper } from '../../../components/ui/NumberStepper/NumberStepper'
import type { CatalogoCie10Item, ConfianzaCie10, ItemLoteCie10, LoteCie10, OpcionCie10 } from '../../../types/cie10'
import { CANTIDAD_MAX, CANTIDAD_MIN } from './preferencias'
import {
    SIN_FILTROS,
    accionDeTecla,
    avisoFaltante,
    avisoSoporte,
    esSeleccionable,
    estadoFila,
    fechaCorta,
    motivoSinCodigo,
    muestraOpciones,
    opcionVecina,
    opcionesVisibles,
    seleccionDe,
    tieneAvisos,
    type EstadoFila,
    type FiltrosBorrador,
    type ObjetivoTecla,
} from './lote'
import { PopoverAnclado } from './PopoverAnclado'
import { RechazoModal } from './RechazoModal'
import styles from './Cie10BatchReview.module.css'

export interface Cie10BatchReviewViewProps {
    lote: LoteCie10 | null
    loading: boolean

    filtros: FiltrosBorrador
    onFiltrosChange: (filtros: FiltrosBorrador) => void
    onBuscar: (filtros: FiltrosBorrador) => void
    filtrando: boolean

    cantidad: number
    onCantidadChange: (cantidad: number) => void
    verDetalle: boolean
    onVerDetalleChange: (ver: boolean) => void

    page: number
    pages: number
    onCambiarPagina: (delta: number) => void

    selecciones: Record<string, string>
    onSeleccionar: (codigoTraductor: string, codigo: string) => void
    editando: ReadonlySet<string>
    onEditar: (codigoTraductor: string, editando: boolean) => void

    seleccionadas: ReadonlySet<string>
    onSeleccionarFila: (codigoTraductor: string, marcada: boolean) => void
    onSeleccionarTodas: (marcar: boolean) => void
    onAceptarSeleccionadas: () => void

    busy: string | null
    onAceptar: (item: ItemLoteCie10, codigo: string) => void
    onRechazar: (item: ItemLoteCie10) => void
    rechazo: {
        item: ItemLoteCie10 | null
        enviando: boolean
        onCancelar: () => void
        onEnviar: (codigo: string, fueraDeCatalogo: boolean) => void
    }
    buscarCatalogo: (q: string) => Promise<CatalogoCie10Item[]>

    accepted: boolean
    onAcceptedChange: (accepted: boolean) => void
    onConfirmar: () => void
}

const OPCIONES_CONFIANZA: { value: FiltrosBorrador['confianza']; label: string }[] = [
    { value: '', label: 'Todas las confianzas' },
    { value: 'ALTA', label: 'Confianza alta' },
    { value: 'MEDIA', label: 'Confianza media' },
    { value: 'BAJA', label: 'Confianza baja' },
]

const ESQUELETOS = 6

function EstadoVacio({ Icono, titulo, texto }: { Icono: typeof CircleX; titulo: string; texto: string }) {
    return (
        <div className={styles.estadoVacio}>
            <Icono size={40} className={styles.estadoVacioIcono} aria-hidden="true" />
            <span className={styles.estadoVacioTitulo}>{titulo}</span>
            <p className={styles.estadoVacioTexto}>{texto}</p>
        </div>
    )
}

export function Cie10BatchReviewView(props: Cie10BatchReviewViewProps) {
    const {
        lote, loading, filtros, onFiltrosChange, onBuscar, filtrando, cantidad, onCantidadChange,
        verDetalle, onVerDetalleChange, rechazo, buscarCatalogo,
    } = props

    if (loading && !lote) {
        return (
            <div className={styles.esqueletos} aria-busy="true" aria-label="Cargando lote CIE-10">
                {Array.from({ length: ESQUELETOS }, (_, index) => <div key={index} className={styles.esqueleto} />)}
            </div>
        )
    }
    if (!lote) {
        return (
            <EstadoVacio
                Icono={CircleX}
                titulo="No se encontró el lote"
                texto="Puede que el enlace esté incompleto o que el lote ya no exista. Regrese a la lista de lotes para elegir otro."
            />
        )
    }

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        onBuscar(filtros)
    }

    const aplicar = (nuevos: FiltrosBorrador) => {
        onFiltrosChange(nuevos)
        onBuscar(nuevos)
    }

    const hayFiltros = filtrando || filtros.confianza !== '' || filtros.q !== ''

    return (
        <section id="cie10-lote" className={styles.batchReview} aria-label="Revisión de autocodificación CIE-10">
            <form className={styles.filtrosLote} onSubmit={handleSubmit} role="search" aria-label="Filtrar diagnósticos del lote">
                <select
                    className={styles.filtroCampo}
                    value={filtros.confianza}
                    onChange={(event) => aplicar({ ...filtros, confianza: event.target.value as FiltrosBorrador['confianza'] })}
                    aria-label="Confianza de la sugerencia principal"
                    title="Filtra por la confianza de la sugerencia principal (la primera de cada fila)"
                >
                    {OPCIONES_CONFIANZA.map((opcion) => (
                        <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
                    ))}
                </select>
                <div className={styles.filtroBuscador}>
                    <input
                        type="text"
                        className={`${styles.filtroCampo} ${styles.filtroTexto}`}
                        value={filtros.q}
                        onChange={(event) => onFiltrosChange({ ...filtros, q: event.target.value })}
                        placeholder="Buscar por descripción médica"
                        aria-label="Buscar por descripción médica"
                        autoComplete="off"
                    />
                    {filtros.q && (
                        <button
                            type="button"
                            className={styles.filtroBorrar}
                            onClick={() => aplicar({ ...filtros, q: '' })}
                            aria-label="Borrar el texto de búsqueda"
                            title="Borrar"
                        >
                            <X size={16} aria-hidden="true" />
                        </button>
                    )}
                </div>
                <button type="submit" className={styles.botonBuscar} aria-label="Buscar" title="Buscar" disabled={loading}>
                    <Search size={20} aria-hidden="true" />
                </button>
                {hayFiltros && (
                    <button
                        type="button"
                        className={styles.botonLimpiar}
                        onClick={() => aplicar(SIN_FILTROS)}
                        aria-label="Limpiar filtros"
                        title="Limpiar filtros"
                    >
                        <Eraser size={20} aria-hidden="true" />
                    </button>
                )}
            </form>

            <div className={styles.batchToolbar}>
                <div className={styles.avisoLote}>
                    <AvisoLote lote={lote} />
                </div>

                {!lote.confirmed && (
                    <div className={styles.herramientas}>
                    <PopoverAnclado
                        etiqueta="Atajos de teclado"
                        icono={<Keyboard size={20} aria-hidden="true" />}
                        alinear="end"
                        botonClassName={styles.tuerca}
                    >
                        <AtajosTeclado />
                    </PopoverAnclado>
                    <PopoverAnclado
                        etiqueta="Ajustes de la revisión"
                        icono={<Settings size={20} aria-hidden="true" />}
                        alinear="end"
                        botonClassName={styles.tuerca}
                    >
                        <div className={styles.ajuste}>
                            <NumberStepper
                                label="Sugerencias por diagnóstico"
                                value={cantidad}
                                min={CANTIDAD_MIN}
                                max={CANTIDAD_MAX}
                                onChange={onCantidadChange}
                            />
                            <p className={styles.globoTexto}>
                                Se muestran las primeras, de la más a la menos probable. Menos opciones hacen la revisión más rápida.
                            </p>
                        </div>
                        <div className={styles.ajuste}>
                            <Interruptor
                                etiqueta="Detalle de la IA"
                                activo={verDetalle}
                                onChange={onVerDetalleChange}
                            />
                            <p className={styles.globoTexto}>
                                Muestra el botón <Info size={12} aria-hidden="true" className={styles.iconoEnTexto} /> en
                                cada sugerencia, con por qué la propuso la IA y sus avisos.
                            </p>
                        </div>
                    </PopoverAnclado>
                    </div>
                )}
            </div>

            <div aria-busy={loading} className={loading ? styles.panelCargando : undefined}>
                {lote.items.length === 0
                    ? (
                        <EstadoVacio
                            Icono={FileSearch}
                            titulo={filtrando ? 'No hay diagnósticos con estos filtros' : 'Este lote no tiene diagnósticos'}
                            texto={filtrando
                                ? 'Pruebe con otra confianza o con otra palabra de la descripción médica.'
                                : 'Regrese a la lista de lotes para elegir otro.'}
                        />
                    )
                    : <Tabla {...props} lote={lote} />}
            </div>

            <Paginacion {...props} lote={lote} />

            <RechazoModal
                isOpen={rechazo.item !== null}
                diagnostico={rechazo.item?.diagnostico ?? ''}
                modo={rechazo.item?.principal ? 'rechazar' : 'ingresar'}
                codigoInicial={rechazo.item?.corrected ? rechazo.item.finalCode : undefined}
                enviando={rechazo.enviando}
                onCancelar={rechazo.onCancelar}
                onEnviar={rechazo.onEnviar}
                buscarCatalogo={buscarCatalogo}
            />

            {!lote.confirmed && <Pie {...props} lote={lote} />}
        </section>
    )
}

const ATAJOS: { teclas: string[]; texto: string }[] = [
    { teclas: ['↑', '↓'], texto: 'Fila anterior o siguiente' },
    { teclas: ['←', '→'], texto: 'Sugerencia anterior o siguiente' },
    { teclas: ['Enter'], texto: 'Aceptar la sugerencia marcada y pasar a la siguiente fila' },
    { teclas: ['R'], texto: 'Rechazar o ingresar el código' },
    { teclas: ['Espacio'], texto: 'Marcar la fila para aceptar seleccionadas' },
    { teclas: ['I'], texto: 'Abrir o cerrar el detalle de la IA' },
    { teclas: ['Inicio', 'Fin'], texto: 'Primera o última fila' },
]

function AtajosTeclado() {
    return (
        <div className={styles.ajuste}>
            <span className={styles.interruptorEtiqueta}>Atajos de teclado</span>
            <p className={styles.globoTexto}>Haga clic en una fila o llegue con Tab, y luego:</p>
            <dl className={styles.atajos}>
                {ATAJOS.map(({ teclas, texto }) => (
                    <div key={texto} className={styles.atajo}>
                        <dt>{teclas.map((tecla) => <kbd key={tecla} className={styles.tecla}>{tecla}</kbd>)}</dt>
                        <dd>{texto}</dd>
                    </div>
                ))}
            </dl>
        </div>
    )
}

function Interruptor({ etiqueta, activo, onChange }: { etiqueta: string; activo: boolean; onChange: (activo: boolean) => void }) {
    return (
        <label className={styles.interruptor}>
            <span className={styles.interruptorEtiqueta}>{etiqueta}</span>
            <input
                type="checkbox"
                role="switch"
                className={styles.interruptorInput}
                checked={activo}
                onChange={(event) => onChange(event.target.checked)}
            />
            <span className={styles.interruptorBarra} aria-hidden="true" />
        </label>
    )
}

function AvisoLote({ lote }: { lote: LoteCie10 }) {
    if (lote.confirmed) {
        return <InlineNotice>Lote confirmado el {fechaCorta(lote.confirmedAt)}. Se muestra solo para consulta.</InlineNotice>
    }
    const pendientes = lote.counts?.pendientes
    if (pendientes === undefined) return null
    if (pendientes > 0) {
        return (
            <InlineNotice>
                Falta aceptar o corregir {pendientes} {pendientes === 1 ? 'diagnóstico' : 'diagnósticos'} del lote.
            </InlineNotice>
        )
    }
    return (
        <div className={styles.completeBanner} role="status">
            <span className={styles.completeIcon} aria-hidden="true">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 8.25L6.5 10.75L12 5.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </span>
            ¡Todo revisado! Listo para confirmar el lote
        </div>
    )
}

const AYUDA_TECLADO_ID = 'cie10-ayuda-teclado'

function objetivoDe(objetivo: EventTarget, fila: HTMLTableRowElement): ObjetivoTecla {
    if (objetivo === fila) return 'fila'
    if (objetivo instanceof HTMLInputElement) {
        if (objetivo.type === 'radio') return 'opcion'
        if (objetivo.type === 'checkbox') return 'casilla'
    }
    if (objetivo instanceof HTMLButtonElement || objetivo instanceof HTMLAnchorElement) return 'boton'
    return 'otro'
}

function Tabla({ lote, ...props }: Cie10BatchReviewViewProps & { lote: LoteCie10 }) {
    const soloLectura = lote.confirmed
    const { seleccionadas, onSeleccionarTodas, busy } = props
    const seleccionables = lote.items.filter(esSeleccionable)
    const marcadas = seleccionables.filter((item) => seleccionadas.has(item.codigoTraductor)).length
    const todas = seleccionables.length > 0 && marcadas === seleccionables.length
    const [detalle, setDetalle] = useState<{ fila: string; codigo: string } | null>(null)
    const columnas = soloLectura ? 3 : 5

    const [activa, setActiva] = useState(0)
    const cuerpo = useRef<HTMLTableSectionElement>(null)
    const enfocar = (indice: number) => {
        const destino = Math.min(lote.items.length - 1, Math.max(0, indice))
        setActiva(destino)
        cuerpo.current?.querySelector<HTMLTableRowElement>(`tr[data-fila="${destino}"]`)?.focus()
    }

    const alternarDetalle = (fila: string, codigo: string | null) => setDetalle((actual) => (
        actual?.fila === fila && actual.codigo === codigo ? null : codigo ? { fila, codigo } : null
    ))

    const manejarTecla = (event: KeyboardEvent<HTMLTableRowElement>, indice: number, item: ItemLoteCie10) => {
        const objetivo = objetivoDe(event.target, event.currentTarget)
        const conOpciones = muestraOpciones(item, props.editando.has(item.codigoTraductor))
        const accion = accionDeTecla(event.key, {
            item, objetivo, conOpciones, soloLectura, verDetalle: props.verDetalle, ocupado: busy !== null,
        })
        if (!accion) return
        event.preventDefault()

        const seleccion = seleccionDe(item, props.selecciones[item.codigoTraductor], props.cantidad)
        switch (accion.tipo) {
            case 'fila': {
                const destino = { anterior: indice - 1, siguiente: indice + 1, primera: 0, ultima: lote.items.length - 1 }
                enfocar(destino[accion.destino])
                break
            }
            case 'opcion': {
                const vecina = opcionVecina(item, seleccion, props.cantidad, accion.delta)
                if (vecina) props.onSeleccionar(item.codigoTraductor, vecina)
                break
            }
            case 'aceptar':
                if (seleccion) {
                    props.onAceptar(item, seleccion)
                    enfocar(indice + 1)
                }
                break
            case 'rechazar':
                props.onRechazar(item)
                break
            case 'marcar':
                props.onSeleccionarFila(item.codigoTraductor, !seleccionadas.has(item.codigoTraductor))
                break
            case 'detalle':
                if (seleccion) alternarDetalle(item.codigoTraductor, seleccion)
                break
        }
    }

    return (
        <div className={styles.batchTableWrap}>
            {!soloLectura && (
                <p id={AYUDA_TECLADO_ID} className={styles.srOnly}>
                    Flechas arriba y abajo para cambiar de fila, izquierda y derecha para cambiar de sugerencia,
                    Enter para aceptar, R para rechazar, Espacio para marcar.
                </p>
            )}
            <table className={styles.batchTable}>
                <thead>
                    <tr>
                        {!soloLectura && (
                            <th className={styles.colCheck}>
                                <input
                                    type="checkbox"
                                    className={styles.casilla}
                                    checked={todas}
                                    ref={(el) => { if (el) el.indeterminate = marcadas > 0 && !todas }}
                                    disabled={seleccionables.length === 0 || busy !== null}
                                    onChange={(event) => onSeleccionarTodas(event.target.checked)}
                                    aria-label="Seleccionar todas las filas pendientes de esta página"
                                />
                            </th>
                        )}
                        <th className={styles.colDiagnostico}>Descripción médica</th>
                        <th>{soloLectura ? 'CIE-10 final' : 'CIE-10 sugerido'}</th>
                        <th className={styles.colEstadoLote}>Estado</th>
                        {!soloLectura && <th className={styles.colAccionesLote}>Acciones</th>}
                    </tr>
                </thead>
                <tbody ref={cuerpo}>
                    {lote.items.map((item, indice) => (
                        <Fila
                            key={item.codigoTraductor}
                            item={item}
                            soloLectura={soloLectura}
                            columnas={columnas}
                            detalleAbierto={detalle?.fila === item.codigoTraductor ? detalle.codigo : null}
                            onDetalle={(codigo) => alternarDetalle(item.codigoTraductor, codigo)}
                            teclado={{
                                activa: indice === Math.min(activa, lote.items.length - 1),
                                indice,
                                onKeyDown: (event) => manejarTecla(event, indice, item),
                                onFocus: () => setActiva(indice),
                            }}
                            {...props}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    )
}

type FilaProps = Omit<Cie10BatchReviewViewProps, 'lote'> & {
    item: ItemLoteCie10
    soloLectura: boolean
    columnas: number
    detalleAbierto: string | null
    onDetalle: (codigo: string | null) => void
    teclado: {
        activa: boolean
        indice: number
        onKeyDown: (event: KeyboardEvent<HTMLTableRowElement>) => void
        onFocus: () => void
    }
}

function Fila({
    item, soloLectura, columnas, detalleAbierto, onDetalle, teclado, cantidad, verDetalle, selecciones, onSeleccionar,
    editando, onEditar, seleccionadas, onSeleccionarFila, busy, onAceptar, onRechazar,
}: FilaProps) {
    const estado = estadoFila(item)
    const enEdicion = editando.has(item.codigoTraductor)
    const decidida = estado === 'aceptado' || estado === 'corregido' || estado === 'confirmado'
    const mostrarOpciones = muestraOpciones(item, enEdicion)
    const seleccion = seleccionDe(item, selecciones[item.codigoTraductor], cantidad)
    const guardando = busy === item.codigoTraductor
    const bloqueada = busy !== null
    const marcada = seleccionadas.has(item.codigoTraductor)
    const detalleId = `detalle-${item.codigoTraductor}`
    const opcionDetalle = verDetalle && mostrarOpciones && detalleAbierto
        ? opcionesVisibles(item, cantidad).find((o) => o.codigo === detalleAbierto) ?? null
        : null

    return (
        <>
        <tr
            data-fila={teclado.indice}
            tabIndex={teclado.activa ? 0 : -1}
            onKeyDown={teclado.onKeyDown}
            onFocus={teclado.onFocus}
            aria-describedby={soloLectura ? undefined : AYUDA_TECLADO_ID}
            className={[
                styles.filaTeclado,
                decidida && !enEdicion ? styles.filaDecidida : '',
                marcada ? styles.filaMarcada : '',
            ].filter(Boolean).join(' ')}
        >
            {!soloLectura && (
                <td className={styles.colCheck}>
                    {esSeleccionable(item) && (
                        <input
                            type="checkbox"
                            className={styles.casilla}
                            checked={marcada}
                            disabled={bloqueada}
                            onChange={(event) => onSeleccionarFila(item.codigoTraductor, event.target.checked)}
                            aria-label={`Seleccionar ${item.diagnostico}`}
                        />
                    )}
                </td>
            )}

            <td className={styles.diagnosisCell}>{item.diagnostico}</td>

            <td>
                {mostrarOpciones && (
                    <Opciones
                        item={item}
                        cantidad={cantidad}
                        seleccion={seleccion}
                        disabled={bloqueada}
                        onSeleccionar={(codigo) => onSeleccionar(item.codigoTraductor, codigo)}
                        verDetalle={verDetalle}
                        detalleAbierto={opcionDetalle?.codigo ?? null}
                        detalleId={detalleId}
                        onDetalle={onDetalle}
                    />
                )}
                {!mostrarOpciones && decidida && <Resultado item={item} />}
                {!mostrarOpciones && !decidida && (
                    <div className={styles.sinCodigo}>
                        <span className={styles.sinCodigoTitulo}>Sin sugerencia de la IA</span>
                        <span className={styles.secondaryText}>{motivoSinCodigo(item)}</span>
                    </div>
                )}
            </td>

            <td><EstadoChip estado={estado} corrected={item.corrected} /></td>

            {!soloLectura && <td>
                <div className={styles.accionesFila}>
                    {decidida && !enEdicion && (
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={bloqueada}
                            onClick={() => (item.sugerencias.length ? onEditar(item.codigoTraductor, true) : onRechazar(item))}
                        >
                            Cambiar
                        </Button>
                    )}

                    {mostrarOpciones && (
                        <>
                            <Button
                                size="sm"
                                disabled={bloqueada || seleccion === null}
                                isLoading={guardando}
                                onClick={() => seleccion && onAceptar(item, seleccion)}
                            >
                                Aceptar
                            </Button>
                            <Button variant="destructive" size="sm" disabled={bloqueada} onClick={() => onRechazar(item)}>
                                Rechazar
                            </Button>
                            {enEdicion && (
                                <Button variant="ghost" size="sm" disabled={bloqueada} onClick={() => onEditar(item.codigoTraductor, false)}>
                                    Cancelar
                                </Button>
                            )}
                        </>
                    )}

                    {estado === 'sin-codigo' && (
                        <Button variant="secondary" size="sm" disabled={bloqueada} isLoading={guardando} onClick={() => onRechazar(item)}>
                            Ingresar código
                        </Button>
                    )}
                </div>
            </td>}
        </tr>

        {opcionDetalle && (
            <tr className={styles.filaDetalle}>
                <td colSpan={columnas} id={detalleId}>
                    <DetalleOpcion opcion={opcionDetalle} onCerrar={() => onDetalle(null)} />
                </td>
            </tr>
        )}
        </>
    )
}

const ESTADO: Record<Exclude<EstadoFila, 'confirmado'>, { texto: string; clase: string }> = {
    'pendiente':  { texto: 'Pendiente', clase: styles.estadoPendiente },
    'sin-codigo': { texto: 'Sin código', clase: styles.estadoSinCodigo },
    'aceptado':   { texto: 'Aceptado', clase: styles.estadoAceptado },
    'corregido':  { texto: 'Corregido', clase: styles.estadoCorregido },
}

function EstadoChip({ estado, corrected }: { estado: EstadoFila; corrected: boolean }) {
    const clave = estado === 'confirmado' ? (corrected ? 'corregido' : 'aceptado') : estado
    const { texto, clase } = ESTADO[clave]
    const conCheck = clave === 'aceptado' || clave === 'corregido'
    return (
        <span className={`${styles.estado} ${clase}`}>
            {conCheck && <CircleCheck size={14} aria-hidden="true" />}
            {texto}
        </span>
    )
}

type NivelConfianza = ConfianzaCie10

const CONFIANZA: Record<NivelConfianza, { Icono: typeof CircleCheck; texto: string; clase: string }> = {
    ALTA:  { Icono: CircleCheck, texto: 'Confianza alta', clase: styles.confianzaAlta },
    MEDIA: { Icono: CircleAlert, texto: 'Confianza media', clase: styles.confianzaMedia },
    BAJA:  { Icono: CircleX, texto: 'Confianza baja', clase: styles.confianzaBaja },
}

function Confianza({ value, conTexto = false }: { value?: NivelConfianza; conTexto?: boolean }) {
    const { Icono, texto, clase } = CONFIANZA[value ?? 'BAJA']
    return (
        <span className={`${styles.confianza} ${clase}`} data-tooltip={conTexto ? undefined : texto}>
            <Icono size={17} aria-hidden="true" />
            <span className={conTexto ? undefined : styles.srOnly}>{texto}</span>
        </span>
    )
}

interface OpcionesProps {
    item: ItemLoteCie10
    cantidad: number
    seleccion: string | null
    disabled: boolean
    onSeleccionar: (codigo: string) => void
    verDetalle: boolean
    detalleAbierto: string | null
    detalleId: string
    onDetalle: (codigo: string) => void
}

function Opciones({ item, cantidad, seleccion, disabled, onSeleccionar, verDetalle, detalleAbierto, detalleId, onDetalle }: OpcionesProps) {
    return (
        <div className={styles.opciones} role="radiogroup" aria-label={`Sugerencias para ${item.diagnostico}`}>
            {opcionesVisibles(item, cantidad).map((opcion) => {
                const marcada = seleccion === opcion.codigo
                const avisos = tieneAvisos(opcion)
                const soporte = avisoSoporte(opcion.soporte)
                return (
                    <div key={opcion.codigo} className={`${styles.opcion} ${marcada ? styles.opcionMarcada : ''}`}>
                        <label className={styles.opcionLabel}>
                            <input
                                type="radio"
                                name={`sugerencia-${item.codigoTraductor}`}
                                value={opcion.codigo}
                                checked={marcada}
                                disabled={disabled}
                                onChange={() => onSeleccionar(opcion.codigo)}
                            />
                            <span className={styles.opcionCodigo}>{opcion.codigo}</span>
                            <Confianza value={opcion.confianza} />
                            <span className={styles.opcionNombre} title={opcion.nombreCatalogo}>{opcion.nombreCatalogo}</span>
                        </label>
                        {verDetalle && (
                            <button
                                type="button"
                                className={`${styles.iconoBoton} ${detalleAbierto === opcion.codigo ? styles.iconoBotonActivo : ''}`}
                                onClick={() => onDetalle(opcion.codigo)}
                                aria-expanded={detalleAbierto === opcion.codigo}
                                aria-controls={detalleAbierto === opcion.codigo ? detalleId : undefined}
                                aria-label={avisos ? `Detalle de ${opcion.codigo}, tiene avisos` : `Detalle de ${opcion.codigo}`}
                                title="Ver detalle"
                            >
                                <Info size={16} aria-hidden="true" />
                                {avisos && <span className={styles.puntoAviso} aria-hidden="true" />}
                            </button>
                        )}
                        {!verDetalle && soporte && (
                            <span className={styles.opcionAviso} data-tooltip={soporte}>
                                <TriangleAlert size={16} aria-hidden="true" />
                                <span className={styles.srOnly}>{soporte}</span>
                            </span>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

function DetalleOpcion({ opcion, onCerrar }: { opcion: OpcionCie10; onCerrar: () => void }) {
    const otraDescripcion = opcion.descripcionModelo.trim().toLowerCase() !== opcion.nombreCatalogo.trim().toLowerCase()
    const soporte = avisoSoporte(opcion.soporte)
    const falta = avisoFaltante(opcion)

    return (
        <div className={styles.detalle} aria-label={`Detalle de ${opcion.codigo}`} role="region">
            <div className={styles.detalleCabecera}>
                <strong className={styles.detalleCodigo}>{opcion.codigo}</strong>
                <Confianza value={opcion.confianza} conTexto />
            </div>

            <div className={styles.detalleSeccion}>
                <span className={styles.detalleEtiqueta}>Nombre en el catálogo</span>
                <p>{opcion.nombreCatalogo}</p>
                {otraDescripcion && (
                    <>
                        <span className={styles.detalleEtiqueta}>Cómo lo describió la IA</span>
                        <p>{opcion.descripcionModelo}</p>
                    </>
                )}
            </div>

            <div className={styles.detalleSeccion}>
                <span className={styles.detalleEtiqueta}>Por qué lo sugirió la IA</span>
                <p>{opcion.razonamiento?.trim() || 'La IA no explicó esta sugerencia.'}</p>
            </div>

            {(soporte || falta) && (
                <div className={styles.detalleAvisos}>
                    {soporte && <InlineNotice tone="warning">{soporte}</InlineNotice>}
                    {falta && <InlineNotice tone="warning">{falta}</InlineNotice>}
                </div>
            )}

            <button type="button" className={styles.detalleCerrar} onClick={onCerrar} aria-label="Cerrar el detalle" title="Cerrar">
                <X size={16} aria-hidden="true" />
            </button>
        </div>
    )
}

function Resultado({ item }: { item: ItemLoteCie10 }) {
    const nombre = item.sugerencias.find((s) => s.codigo === item.finalCode)?.nombreCatalogo
    return (
        <div className={styles.resultado}>
            <span>
                <strong>{item.finalCode}</strong>
                {nombre && <span className={styles.secondaryText}>{nombre}</span>}
            </span>
            {item.corrected && item.principal && (
                <span className={styles.secondaryText}>La IA sugirió {item.principal.codigo}</span>
            )}
        </div>
    )
}

function Paginacion({ lote, loading, page, pages, onCambiarPagina }: Cie10BatchReviewViewProps & { lote: LoteCie10 }) {
    const desde = lote.items.length ? (lote.page - 1) * lote.pageSize + 1 : 0
    const hasta = desde ? desde + lote.items.length - 1 : 0

    return (
        <div className={styles.batchFooter}>
            <span className={styles.batchCount} aria-live="polite">
                {desde} a {hasta} de {lote.total} {lote.total === 1 ? 'registro' : 'registros'}
            </span>

            {pages > 1 && (
                <div className={styles.batchPagination}>
                    <Button variant="ghost" size="sm" disabled={page === 1 || loading} onClick={() => onCambiarPagina(-1)}>Anterior</Button>
                    <span>Página {page} de {pages}</span>
                    <Button variant="ghost" size="sm" disabled={page >= pages || loading} onClick={() => onCambiarPagina(1)}>Siguiente</Button>
                </div>
            )}
        </div>
    )
}

function Pie({
    lote, busy, accepted, onAcceptedChange, onConfirmar, seleccionadas, onAceptarSeleccionadas,
}: Cie10BatchReviewViewProps & { lote: LoteCie10 }) {
    const faltan = (lote.counts?.pendientes ?? 0) > 0
    const marcadas = seleccionadas.size

    return (
        <footer className={styles.clausePanel}>
            <ConsentCard
                id="cie10-clausula"
                title="Declaración de responsabilidad profesional"
                description={lote.clause.text}
                chipText="Obligatoria"
                chipColor="blue"
                checked={accepted}
                status={accepted ? 'success' : 'default'}
                onCheckedChange={onAcceptedChange}
            />
            <div className={styles.clauseAcciones}>
                <Button
                    variant="ghost"
                    disabled={marcadas === 0 || busy !== null}
                    isLoading={busy === 'masivo'}
                    onClick={onAceptarSeleccionadas}
                >
                    {marcadas > 0 ? `Aceptar seleccionadas (${marcadas})` : 'Aceptar seleccionadas'}
                </Button>
                <Button onClick={onConfirmar} disabled={!accepted || faltan || busy !== null} isLoading={busy === 'confirm'}>
                    Confirmar lote revisado
                </Button>
            </div>
        </footer>
    )
}

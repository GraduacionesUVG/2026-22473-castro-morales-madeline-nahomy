/** Tarjetas de cada tablero de reportería y su orden. */

import { v4 as uuidv4 } from 'uuid'
import type { AgentChartBlock, AgentResponse, AgentTableBlock } from '../../../services/reporting.service'
import { bloquesSeguros, formatearEncabezado, type ChatMessage, type FilaResultado } from './chat'
import { esClaveDeTiempo } from './formato'

export type DashboardId = 'produccion' | 'ficha'

export const DASHBOARD_IDS: readonly DashboardId[] = ['produccion', 'ficha']

export const NOMBRE_DASHBOARD: Record<DashboardId, string> = {
    produccion: 'Producción ambulatoria',
    ficha: 'Ficha clínica',
}

export const TARJETAS_FIJAS: Record<DashboardId, readonly string[]> = {
    produccion: ['produccion-mensual', 'produccion-top'],
    ficha: ['ficha-mensual'],
}

export const MAX_WIDGETS = 24

export type TipoWidget = 'tabla' | 'grafica'

export interface WidgetAgente {
    id: string
    tipo: TipoWidget
    pregunta: string
    creado: string
    bloque: AgentTableBlock | AgentChartBlock
}

export interface Tablero {
    orden: string[]
    widgets: Record<string, WidgetAgente>
    anchas: string[]
    medias: string[]
}

export type Tableros = Record<DashboardId, Tablero>

function tableroInicial(dashboard: DashboardId): Tablero {
    return { orden: [...TARJETAS_FIJAS[dashboard]], widgets: {}, anchas: [], medias: [] }
}

export function tablerosIniciales(): Tableros {
    return { produccion: tableroInicial('produccion'), ficha: tableroInicial('ficha') }
}

export interface AgregadoAlTablero {
    destino: DashboardId
    widgetId: string
}

export function tableroLleno(tablero: Tablero): boolean {
    return Object.keys(tablero.widgets).length >= MAX_WIDGETS
}

export function contarTarjetas(tableros: Tableros): Record<DashboardId, number> {
    return {
        produccion: Object.keys(tableros.produccion.widgets).length,
        ficha: Object.keys(tableros.ficha.widgets).length,
    }
}

export function agregarWidget(tableros: Tableros, dashboard: DashboardId, widget: WidgetAgente): Tableros {
    const tablero = tableros[dashboard]
    if (tableroLleno(tablero)) return tableros
    return {
        ...tableros,
        [dashboard]: {
            ...tablero,
            orden: [...tablero.orden, widget.id],
            widgets: { ...tablero.widgets, [widget.id]: widget },
        },
    }
}

export function quitarWidget(tableros: Tableros, dashboard: DashboardId, id: string): Tableros {
    const tablero = tableros[dashboard]
    if (!(id in tablero.widgets)) return tableros
    const widgets = { ...tablero.widgets }
    delete widgets[id]
    return {
        ...tableros,
        [dashboard]: {
            orden: tablero.orden.filter((item) => item !== id),
            widgets,
            anchas: tablero.anchas.filter((item) => item !== id),
            medias: tablero.medias.filter((item) => item !== id),
        },
    }
}

export function vaciarTablero(tableros: Tableros, dashboard: DashboardId): Tableros {
    return { ...tableros, [dashboard]: tableroInicial(dashboard) }
}

export function alternarAncho(tableros: Tableros, dashboard: DashboardId, id: string): Tableros {
    const tablero = tableros[dashboard]
    if (!tablero.orden.includes(id)) return tableros
    const sinElla = (lista: string[]) => lista.filter((item) => item !== id)

    if (distribuirFilas(tablero).aLoAncho.has(id)) {
        const achicada = { ...tablero, anchas: sinElla(tablero.anchas) }
        const medias = distribuirFilas(achicada).rellenos.has(id) ? [...tablero.medias, id] : tablero.medias
        return { ...tableros, [dashboard]: { ...achicada, medias } }
    }
    return {
        ...tableros,
        [dashboard]: {
            ...tablero,
            orden: subirCompanera(tablero, id),
            anchas: [...tablero.anchas, id],
            medias: sinElla(tablero.medias),
        },
    }
}

function subirCompanera(tablero: Tablero, id: string): string[] {
    const anchas = new Set(tablero.anchas)
    let sola: string | null = null
    for (const actual of tablero.orden) {
        if (actual === id) break
        sola = anchas.has(actual) ? null : sola ? null : actual
    }
    if (!sola) return tablero.orden

    const indice = tablero.orden.indexOf(id)
    const siguiente = tablero.orden[indice + 1]
    if (!siguiente || anchas.has(siguiente)) return tablero.orden

    const orden = tablero.orden.filter((item) => item !== siguiente)
    orden.splice(indice, 0, siguiente)
    return orden
}

export function distribuirFilas(tablero: Tablero): { aLoAncho: Set<string>; rellenos: Set<string> } {
    const anchas = new Set(tablero.anchas)
    const rellenos = new Set<string>()
    let sola: string | null = null
    for (const id of tablero.orden) {
        if (anchas.has(id)) {
            if (sola) rellenos.add(sola)
            sola = null
        } else {
            sola = sola ? null : id
        }
    }
    if (sola) rellenos.add(sola)
    for (const id of tablero.medias) rellenos.delete(id)
    return { aLoAncho: new Set([...anchas, ...rellenos]), rellenos }
}

export function reordenarTablero(tableros: Tableros, dashboard: DashboardId, orden: string[]): Tableros {
    return {
        ...tableros,
        [dashboard]: normalizarTablero(dashboard, { ...tableros[dashboard], orden }),
    }
}

function normalizarTablero(dashboard: DashboardId, tablero: Tablero): Tablero {
    const validas = new Set([...TARJETAS_FIJAS[dashboard], ...Object.keys(tablero.widgets)])
    const orden = [...new Set(tablero.orden)].filter((id) => validas.has(id))
    for (const id of validas) {
        if (!orden.includes(id)) orden.push(id)
    }
    const anchas = [...new Set(tablero.anchas)].filter((id) => validas.has(id))
    const medias = [...new Set(tablero.medias)].filter((id) => validas.has(id) && !anchas.includes(id))
    return { orden, widgets: tablero.widgets, anchas, medias }
}

type MensajeAgente = Extract<ChatMessage, { role: 'agent' }>

export function destinoPorFuente(source: AgentResponse['source'] | undefined, activo: DashboardId): DashboardId {
    if (source === 'SIGSA') return 'produccion'
    if (source === 'CONGENIA') return 'ficha'
    return activo
}

export function esGrafica(bloque: { type: string }): bloque is AgentChartBlock {
    return bloque.type === 'bar_chart' || bloque.type === 'line_chart' || bloque.type === 'stacked_bar'
}

export function esTabla(bloque: { type: string }): bloque is AgentTableBlock {
    return bloque.type === 'table' || bloque.type === 'pivot'
}

export function bloqueParaWidget(
    message: MensajeAgente,
    tipo: TipoWidget,
): AgentTableBlock | AgentChartBlock | null {
    if (message.tone !== 'success') return null
    const bloques = message.blocks ?? []
    const grafica = bloques.find(esGrafica)
    const tabla = bloques.find(esTabla)

    const filas = message.result ?? []
    const deResultado: AgentTableBlock | null = filas.length > 0
        ? { type: 'table', title: 'Resultado del agente', columns: columnasDe(filas), rows: filas }
        : null

    if (tipo === 'grafica') {
        if (grafica) return grafica
        const base = tabla ?? deResultado
        return base ? graficaDesdeTabla(base) : null
    }

    if (tabla) return tabla
    if (grafica) return { type: 'table', title: grafica.title, columns: columnasDe(grafica.rows), rows: grafica.rows }
    return deResultado
}

const MAX_FILAS_TABLA = 50
const MAX_FILAS_GRAFICA = 25
const MAX_SERIES = 5
const CLAVES_DE_TIEMPO = ['mes', 'fecha', 'fecha_consulta', 'periodo']
const OTROS = 'Otros'

function medida(valor: unknown): number | null {
    if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null
    if (typeof valor !== 'string' || !/^-?\d+(?:\.\d+)?$/.test(valor.trim())) return null
    return Number(valor)
}

function esTexto(valor: unknown): boolean {
    return typeof valor === 'string' && medida(valor) === null
}

export function graficaDesdeTabla(tabla: AgentTableBlock): AgentChartBlock | null {
    const filas = tabla.rows.slice(0, MAX_FILAS_TABLA)
    if (filas.length < 2) return null

    const columnas = tabla.columns.length > 0 ? tabla.columns : columnasDe(filas)
    const categoryKey = CLAVES_DE_TIEMPO.find((clave) =>
        columnas.includes(clave) && filas.some((fila) => typeof fila[clave] === 'string'))
        ?? columnas.find((columna) => filas.some((fila) => esTexto(fila[columna])))
    if (!categoryKey) return null

    const valores = columnas
        .filter((columna) => columna !== categoryKey && filas.some((fila) => medida(fila[columna]) !== null))
        .slice(0, MAX_SERIES)
    if (valores.length === 0) return null

    const categorias = filas.map((fila) => String(fila[categoryKey] ?? ''))
    const repetidas = new Set(categorias).size < categorias.length

    if (repetidas) {
        const dimensiones = columnas.filter((columna) =>
            columna !== categoryKey && !valores.includes(columna) && filas.some((fila) => esTexto(fila[columna])))
        if (valores.length !== 1 || dimensiones.length !== 1) return null
        return { title: tabla.title, ...apilar(filas, categoryKey, dimensiones[0], valores[0]) }
    }

    const rows = filas.slice(0, MAX_FILAS_GRAFICA)
    return {
        type: esClaveDeTiempo(categoryKey, categorias) ? 'line_chart' : 'bar_chart',
        title: tabla.title,
        categoryKey,
        series: valores.map((dataKey) => ({ dataKey, label: formatearEncabezado(dataKey) })),
        rows: rows.map((fila) => ({
            ...fila,
            ...Object.fromEntries(valores.map((columna) => [columna, medida(fila[columna]) ?? 0])),
        })),
    }
}

function apilar(
    filas: FilaResultado[],
    categoryKey: string,
    dimension: string,
    valor: string,
): Omit<AgentChartBlock, 'title'> {
    const etiqueta = (dato: unknown) => (dato == null || dato === '' ? 'Sin dato' : String(dato))
    const categorias = [...new Set(filas.map((fila) => etiqueta(fila[categoryKey])))]
    const grupos = [...new Set(filas.map((fila) => etiqueta(fila[dimension])))]

    const anchas = new Map(categorias.map((categoria) =>
        [categoria, Object.fromEntries(grupos.map((grupo) => [grupo, 0])) as Record<string, number>]))
    for (const fila of filas) {
        anchas.get(etiqueta(fila[categoryKey]))![etiqueta(fila[dimension])] += medida(fila[valor]) ?? 0
    }

    const total = (grupo: string) => [...anchas.values()].reduce((suma, fila) => suma + fila[grupo], 0)
    const visibles = grupos.length <= MAX_SERIES
        ? grupos
        : grupos.filter((grupo) => grupo !== OTROS)
            .sort((a, b) => total(b) - total(a) || a.localeCompare(b))
            .slice(0, MAX_SERIES - 1)
    const resto = grupos.filter((grupo) => !visibles.includes(grupo))
    const series = resto.length > 0 ? [...visibles, OTROS] : visibles

    return {
        type: 'stacked_bar',
        categoryKey,
        series: series.map((grupo) => ({ dataKey: grupo, label: grupo })),
        rows: categorias.slice(0, MAX_FILAS_GRAFICA).map((categoria) => {
            const fila = anchas.get(categoria)!
            return {
                [categoryKey]: categoria,
                ...Object.fromEntries(visibles.map((grupo) => [grupo, fila[grupo]])),
                ...(resto.length > 0 && { [OTROS]: resto.reduce((suma, grupo) => suma + fila[grupo], 0) }),
            }
        }),
    }
}

function columnasDe(filas: FilaResultado[]): string[] {
    return [...new Set(filas.flatMap((fila) => Object.keys(fila)))]
}

export function claveAgregado(messageId: string, tipo: TipoWidget): string {
    return `${messageId}:${tipo}`
}

export function crearWidget(
    tipo: TipoWidget,
    bloque: AgentTableBlock | AgentChartBlock,
    pregunta: string,
    ahora = new Date(),
): WidgetAgente {
    return { id: `w-${uuidv4()}`, tipo, pregunta: pregunta.slice(0, 500), creado: ahora.toISOString(), bloque }
}

const FORMATO = 'congenia-reporteria'
const VERSION = 1

export function serializarTableros(tableros: Tableros, ahora = new Date()): string {
    return JSON.stringify({ formato: FORMATO, version: VERSION, exportado: ahora.toISOString(), tableros }, null, 2)
}

export function fechaParaArchivo(fecha = new Date()): string {
    const dos = (valor: number) => String(valor).padStart(2, '0')
    return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`
}

export const PREFIJO_ARCHIVO_TABLERO = 'tablero-reporteria'

export function nombreArchivoTablero(fecha = new Date()): string {
    return `${PREFIJO_ARCHIVO_TABLERO}-${fechaParaArchivo(fecha)}.json`
}

export function nombreArchivoPdf(dashboard: DashboardId, fecha = new Date()): string {
    return `reporteria-${dashboard}-${fechaParaArchivo(fecha)}.pdf`
}

export class ArchivoInvalidoError extends Error {}

const USE_EL_EXPORTADO = 'Use el archivo que descargó con la opción Exportar.'

export function leerArchivoTableros(texto: string): Tableros {
    let datos: unknown
    try {
        datos = JSON.parse(texto)
    } catch {
        throw new ArchivoInvalidoError(`No se pudo leer este archivo. ${USE_EL_EXPORTADO}`)
    }

    if (!isRecord(datos) || datos.formato !== FORMATO || !isRecord(datos.tableros)) {
        throw new ArchivoInvalidoError(`Este archivo no es un tablero de reportería. ${USE_EL_EXPORTADO}`)
    }
    if (datos.version !== VERSION) {
        throw new ArchivoInvalidoError('Este archivo viene de otra versión de la reportería y no se puede abrir aquí.')
    }

    const tableros = datos.tableros
    const resultado = tablerosIniciales()
    for (const dashboard of DASHBOARD_IDS) {
        const crudo = tableros[dashboard]
        if (!isRecord(crudo)) continue
        resultado[dashboard] = normalizarTablero(dashboard, {
            orden: textos(crudo.orden),
            widgets: widgetsSeguros(crudo.widgets),
            anchas: textos(crudo.anchas),
            medias: textos(crudo.medias),
        })
    }
    return resultado
}

export const MAX_BYTES_ARCHIVO = 2_000_000

export async function leerArchivoSubido(archivo: Pick<File, 'size' | 'text'>): Promise<Tableros> {
    if (archivo.size > MAX_BYTES_ARCHIVO) {
        throw new ArchivoInvalidoError(`Este archivo es demasiado grande para ser un tablero. ${USE_EL_EXPORTADO}`)
    }
    let texto: string
    try {
        texto = await archivo.text()
    } catch {
        throw new ArchivoInvalidoError(`No se pudo leer este archivo. ${USE_EL_EXPORTADO}`)
    }
    return leerArchivoTableros(texto)
}

function widgetsSeguros(crudos: unknown): Record<string, WidgetAgente> {
    if (!isRecord(crudos)) return {}

    const widgets: Record<string, WidgetAgente> = {}
    for (const candidato of Object.values(crudos)) {
        if (Object.keys(widgets).length >= MAX_WIDGETS) break
        if (!isRecord(candidato)) continue

        const { id, tipo, pregunta, creado } = candidato
        if (typeof id !== 'string' || !/^w-[\w-]{1,64}$/.test(id) || id in widgets) continue
        if (tipo !== 'tabla' && tipo !== 'grafica') continue

        const [crudo] = bloquesSeguros([candidato.bloque])
        const bloque = !crudo ? null
            : tipo === 'tabla' ? (esTabla(crudo) ? crudo : null)
            : (esGrafica(crudo) ? crudo : null)
        if (!bloque) continue

        widgets[id] = {
            id,
            tipo,
            pregunta: typeof pregunta === 'string' ? pregunta.slice(0, 500) : '',
            creado: typeof creado === 'string' && !Number.isNaN(Date.parse(creado)) ? creado : new Date(0).toISOString(),
            bloque,
        }
    }
    return widgets
}

function textos(valor: unknown): string[] {
    return Array.isArray(valor) ? valor.filter((item): item is string => typeof item === 'string') : []
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

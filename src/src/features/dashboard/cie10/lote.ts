/** Reglas de la revisión por lote CIE-10: opciones, selección y estado de cada fila. */

import type { CatalogoCie10Item, ConfianzaCie10, FiltrosLoteCie10, ItemLoteCie10, OpcionCie10 } from '../../../types/cie10'
import { clampCantidad } from './preferencias'

export function recortar(sugerencias: readonly OpcionCie10[], n: number): OpcionCie10[] {
    return sugerencias.slice(0, clampCantidad(n))
}

export interface FiltrosBorrador {
    confianza: ConfianzaCie10 | ''
    q: string
}

export const SIN_FILTROS: FiltrosBorrador = { confianza: '', q: '' }

export function aFiltros({ confianza, q }: FiltrosBorrador): FiltrosLoteCie10 {
    return {
        ...(confianza ? { confianza } : {}),
        ...(q.trim() ? { q: q.trim() } : {}),
    }
}

export type EstadoFila = 'pendiente' | 'sin-codigo' | 'aceptado' | 'corregido' | 'confirmado'

export function estadoFila(item: ItemLoteCie10): EstadoFila {
    if (item.status === 'CONFIRMADO') return 'confirmado'
    if (item.corrected) return 'corregido'
    if (item.reviewed) return 'aceptado'
    return item.principal ? 'pendiente' : 'sin-codigo'
}

export function muestraOpciones(item: ItemLoteCie10, enEdicion: boolean): boolean {
    const estado = estadoFila(item)
    const decidida = estado === 'aceptado' || estado === 'corregido' || estado === 'confirmado'
    return item.sugerencias.length > 0 && (!decidida || enEdicion)
}

export function esSeleccionable(item: ItemLoteCie10): boolean {
    return estadoFila(item) === 'pendiente'
}

export function opcionesVisibles(item: ItemLoteCie10, cantidad: number): OpcionCie10[] {
    return recortar(item.sugerencias, cantidad)
}

export function seleccionDe(item: ItemLoteCie10, elegida: string | undefined, cantidad: number): string | null {
    const visibles = opcionesVisibles(item, cantidad)
    const visible = (codigo: string | undefined) => !!codigo && visibles.some((o) => o.codigo === codigo)

    if (visible(elegida)) return elegida!
    if (estadoFila(item) === 'aceptado' && visible(item.finalCode)) return item.finalCode
    return visibles[0]?.codigo ?? null
}

export function motivoSinCodigo(item: ItemLoteCie10): string {
    if (item.error === 'CIE10_EXACT_FIVE_SUGGESTIONS_NOT_MET') {
        return 'La IA no logró completar cinco alternativas válidas. Escriba el código correcto para continuar.'
    }
    if (item.error) return 'La IA no respondió para este diagnóstico.'
    return item.razonamientoClinico?.trim()
        || 'El texto no tiene información suficiente para proponer un código.'
}

export function avisoSoporte(soporte: OpcionCie10['soporte']): string | null {
    if (soporte === 'REFERENCIA_EXTERNA') {
        return 'Viene de una referencia externa: no está en el catálogo institucional. Verifique que aplique.'
    }
    if (soporte === 'REQUIERE_ATENCION') {
        return 'La IA lo propuso, pero no está respaldado por el catálogo recuperado. Revíselo con cuidado.'
    }
    return null
}

export function avisoFaltante(opcion: OpcionCie10): string | null {
    const falta = opcion.informacionFaltante ?? []
    if (falta.length === 0) return null
    const lista = falta.length === 1 ? falta[0] : `${falta.slice(0, -1).join(', ')} y ${falta[falta.length - 1]}`
    return `Al diagnóstico le falta: ${lista.toLowerCase()}. Si la ficha lo tiene, puede haber un código más específico.`
}

export function tieneAvisos(opcion: OpcionCie10): boolean {
    return avisoSoporte(opcion.soporte) !== null || avisoFaltante(opcion) !== null
}

const FORMATO_CODIGO_LIBRE = /^[A-Z]\d{2}(\.[0-9A-Z]{1,4})?$/

export function esFueraDeCatalogo(item: CatalogoCie10Item): boolean {
    return !item.enCatalogoInstitucional && !item.enReferenciaExterna
}

export function codigoLibre(texto: string): string | null {
    const codigo = texto.trim().toUpperCase()
    return FORMATO_CODIGO_LIBRE.test(codigo) ? codigo : null
}

const MES = new Intl.DateTimeFormat('es-GT', { month: 'long' })

export function etiquetaPeriodo(periodo: string | undefined): string {
    const [anio, mes] = (periodo ?? '').split('-').map(Number)
    if (!anio || !mes || mes < 1 || mes > 12) return periodo ?? ''
    const nombre = MES.format(new Date(anio, mes - 1, 1))
    return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${anio}`
}

const FECHA = new Intl.DateTimeFormat('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' })

export function fechaCorta(iso: string | null | undefined): string {
    if (!iso) return ''
    const fecha = new Date(iso)
    return Number.isNaN(fecha.getTime()) ? '' : FECHA.format(fecha).replace(/\//g, '-')
}

export type AccionTeclado =
    | { tipo: 'fila'; destino: 'anterior' | 'siguiente' | 'primera' | 'ultima' }
    | { tipo: 'opcion'; delta: -1 | 1 }
    | { tipo: 'aceptar' }
    | { tipo: 'rechazar' }
    | { tipo: 'marcar' }
    | { tipo: 'detalle' }

export type ObjetivoTecla = 'fila' | 'opcion' | 'casilla' | 'boton' | 'otro'

export interface ContextoTecla {
    item: ItemLoteCie10
    objetivo: ObjetivoTecla
    conOpciones: boolean
    soloLectura: boolean
    verDetalle: boolean
    ocupado: boolean
}

export function accionDeTecla(tecla: string, ctx: ContextoTecla): AccionTeclado | null {
    if (tecla === 'ArrowDown') return { tipo: 'fila', destino: 'siguiente' }
    if (tecla === 'ArrowUp') return { tipo: 'fila', destino: 'anterior' }
    if (tecla === 'Home' && ctx.objetivo === 'fila') return { tipo: 'fila', destino: 'primera' }
    if (tecla === 'End' && ctx.objetivo === 'fila') return { tipo: 'fila', destino: 'ultima' }

    const desdeLaFila = ctx.objetivo === 'fila' || ctx.objetivo === 'opcion'
    if (ctx.soloLectura || ctx.ocupado || !desdeLaFila) return null

    const sinCodigo = estadoFila(ctx.item) === 'sin-codigo'
    const tecl = tecla.length === 1 ? tecla.toLowerCase() : tecla

    if ((tecl === 'ArrowLeft' || tecl === 'ArrowRight') && ctx.conOpciones) {
        return { tipo: 'opcion', delta: tecl === 'ArrowLeft' ? -1 : 1 }
    }
    if (tecl === 'Enter') return ctx.conOpciones ? { tipo: 'aceptar' } : sinCodigo ? { tipo: 'rechazar' } : null
    if (tecl === 'r' && (ctx.conOpciones || sinCodigo)) return { tipo: 'rechazar' }
    if (tecl === ' ' && esSeleccionable(ctx.item)) return { tipo: 'marcar' }
    if (tecl === 'i' && ctx.conOpciones && ctx.verDetalle) return { tipo: 'detalle' }
    return null
}

export function opcionVecina(item: ItemLoteCie10, seleccion: string | null, cantidad: number, delta: -1 | 1): string | null {
    const visibles = opcionesVisibles(item, cantidad)
    if (visibles.length === 0) return null
    const actual = visibles.findIndex((o) => o.codigo === seleccion)
    const siguiente = Math.min(visibles.length - 1, Math.max(0, (actual === -1 ? 0 : actual) + delta))
    return visibles[siguiente].codigo
}

export function totalPaginas(total: number, pageSize: number): number {
    return Math.max(1, Math.ceil(total / Math.max(1, pageSize)))
}

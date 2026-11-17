/** Estilo compartido por todas las gráficas de reportería. */

import type { AgentChartBlock } from '../../../services/reporting.service'
import { esClaveDeTiempo, formatearNumeroCompacto } from './formato'

export const COLOR = {
    primario: '#003E69',
    secundario: '#45779E',
    area: '#AED3F2',
    cuadricula: '#E8E8E8',
    eje: '#6B7280',
    cursor: '#F1F5F9',
} as const

export const COLORES_SERIES = [COLOR.secundario, '#D97706', '#3F7D4D', '#8B5CF6', '#C2415D'] as const

export const EJE = {
    tick: { fill: COLOR.eje, fontSize: 12 },
    tickLine: false,
} as const

export const EJE_CATEGORIAS_LARGAS = {
    tick: { fill: COLOR.eje, fontSize: 11 },
    tickLine: false,
    axisLine: false,
    width: 128,
    interval: 0,
} as const

export const EJE_NUMERICO = {
    ...EJE,
    allowDecimals: false,
    tickFormatter: (valor: number) => formatearNumeroCompacto(valor),
    axisLine: false,
} as const

export const ESTILO_TOOLTIP = { borderRadius: 10, borderColor: COLOR.cuadricula, fontSize: 13 } as const

export const MARGEN = { top: 8, right: 24, bottom: 0, left: 0 } as const

export const LARGO_CATEGORIA = 18

const LARGO_PARA_HORIZONTAL = 16
const MUCHAS_CATEGORIAS = 6
const LARGO_MEDIANO = 8

export interface FormaGrafica {
    tipo: 'area' | 'lineas' | 'barras'
    horizontal: boolean
    apilada: boolean
    tiempo: boolean
    leyenda: boolean
}

export function formaDeGrafica(block: AgentChartBlock): FormaGrafica {
    const valores = block.rows.map((fila) => fila[block.categoryKey])
    const tiempo = esClaveDeTiempo(block.categoryKey, valores)
    const apilada = block.type === 'stacked_bar'
    const leyenda = block.series.length > 1

    if (block.type === 'line_chart' || (tiempo && !apilada)) {
        return { tipo: block.series.length > 1 ? 'lineas' : 'area', horizontal: false, apilada: false, tiempo, leyenda }
    }

    const largos = valores.map((valor) => String(valor ?? '').length)
    const horizontal = !tiempo && (
        largos.some((largo) => largo > LARGO_PARA_HORIZONTAL)
        || (valores.length > MUCHAS_CATEGORIAS && largos.some((largo) => largo > LARGO_MEDIANO))
    )
    return { tipo: 'barras', horizontal, apilada, tiempo, leyenda }
}

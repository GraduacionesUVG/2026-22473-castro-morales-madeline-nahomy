/** Formato de números, meses y fechas para la reportería. */

import type { MonthlyItem } from '../../../services/reporting.service'

const NUMERO = new Intl.NumberFormat('es-GT')
const UN_DECIMAL = new Intl.NumberFormat('es-GT', { maximumFractionDigits: 1 })
const TRES_CIFRAS = new Intl.NumberFormat('es-GT', { maximumSignificantDigits: 3 })

const MES_CORTO = new Intl.DateTimeFormat('es-GT', { month: 'short', year: 'numeric', timeZone: 'UTC' })
const MES_LARGO = new Intl.DateTimeFormat('es-GT', { month: 'long', year: 'numeric', timeZone: 'UTC' })

const PATRON_MES = /^(\d{4})-(\d{2})/

export function formatearNumero(valor: number): string {
    return NUMERO.format(valor)
}

export function formatearNumeroCompacto(valor: number): string {
    const absoluto = Math.abs(valor)
    if (absoluto >= 1_000_000) return `${TRES_CIFRAS.format(valor / 1_000_000)} M`
    if (absoluto >= 1_000) return `${TRES_CIFRAS.format(valor / 1_000)} k`
    return UN_DECIMAL.format(valor)
}

export function formatearMes(mes: string, estilo: 'corto' | 'largo' = 'corto'): string {
    const match = PATRON_MES.exec(mes)
    if (!match) return mes

    const fecha = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1))
    return (estilo === 'corto' ? MES_CORTO : MES_LARGO).format(fecha)
}

const FECHA = new Intl.DateTimeFormat('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })

const PATRON_SOLO_MES = /^\d{4}-\d{2}$/
const PATRON_FECHA = /^(\d{4})-(\d{2})-(\d{2})(?:T[\d:.]+Z?)?$/
const CLAVES_DE_MES = /^(mes|periodo)$/i
const CLAVES_DE_TIEMPO = /^(mes|periodo|fecha)$/i

export function formatearFecha(valor: string): string {
    const match = PATRON_FECHA.exec(valor)
    if (!match) return valor
    return FECHA.format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))))
}

export function formatearCategoria(valor: string, clave?: string): string {
    if (PATRON_SOLO_MES.test(valor) || (clave && CLAVES_DE_MES.test(clave) && PATRON_FECHA.test(valor))) {
        return formatearMes(valor)
    }
    return formatearFecha(valor)
}

export function esClaveDeTiempo(clave: string, valores: unknown[]): boolean {
    if (CLAVES_DE_TIEMPO.test(clave)) return true
    return valores.length > 0 && valores.every((valor) => typeof valor === 'string' && PATRON_MES.test(valor))
}

export function ultimosMeses(items: MonthlyItem[], cantidad = 12): MonthlyItem[] {
    return items.slice(-cantidad)
}

export function truncar(texto: string, maximo: number): string {
    return texto.length <= maximo ? texto : `${texto.slice(0, maximo - 1).trimEnd()}…`
}

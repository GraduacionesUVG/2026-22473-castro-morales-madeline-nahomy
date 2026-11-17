/** Tipo y validación del rango de fechas. */

export interface DateRange {
    desde: string
    hasta: string
}

export function isInvalidRange({ desde, hasta }: DateRange): boolean {
    if (!desde || !hasta) return false
    return desde > hasta
}

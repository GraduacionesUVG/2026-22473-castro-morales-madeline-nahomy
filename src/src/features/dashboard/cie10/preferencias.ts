/** Preferencias de visualización del revisor CIE-10 guardadas en el navegador. */

export const CANTIDAD_MIN = 1
export const CANTIDAD_MAX = 5
export const CANTIDAD_POR_DEFECTO = 5

const CANTIDAD_KEY = 'congenia.cie10.cantidad'
const VER_DETALLE_KEY = 'congenia.cie10.verDetalle'

export function clampCantidad(n: number): number {
    if (!Number.isFinite(n)) return CANTIDAD_POR_DEFECTO
    return Math.min(CANTIDAD_MAX, Math.max(CANTIDAD_MIN, Math.round(n)))
}

function leer(clave: string): string | null {
    try {
        return window.localStorage.getItem(clave)
    } catch {
        return null
    }
}

function guardar(clave: string, valor: string): void {
    try {
        window.localStorage.setItem(clave, valor)
    } catch {}
}

export function leerCantidad(): number {
    const guardada = leer(CANTIDAD_KEY)
    return guardada === null ? CANTIDAD_POR_DEFECTO : clampCantidad(Number(guardada))
}

export function guardarCantidad(cantidad: number): void {
    guardar(CANTIDAD_KEY, String(cantidad))
}

export function leerVerDetalle(): boolean {
    return leer(VER_DETALLE_KEY) !== 'false'
}

export function guardarVerDetalle(ver: boolean): void {
    guardar(VER_DETALLE_KEY, String(ver))
}

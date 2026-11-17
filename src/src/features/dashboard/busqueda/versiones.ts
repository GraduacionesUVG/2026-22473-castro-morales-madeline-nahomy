/** Cálculo de las versiones de una ficha para el selector del visor. */

import type { FichaSummary } from '../../../services/ficha.service'

const ESTADO_BORRADOR = 'BORRADOR'

const ESTADO_PENDIENTE = 'PENDIENTE'

export function versionesDelLinaje(fichas: FichaSummary[], fichaId: string): FichaSummary[] {
    const actual = fichas.find((ficha) => ficha.fichaId === fichaId)
    if (!actual) return []

    return fichas
        .filter((ficha) =>
            ficha.fichaRaizId === actual.fichaRaizId &&
            (ficha.fichaId === fichaId || estadoDe(ficha) !== ESTADO_BORRADOR),
        )
        .sort((a, b) => a.revision - b.revision)
}

function estadoDe(ficha: FichaSummary): string {
    return ficha.estadoFicha ?? ficha.estado
}

const FECHA_CORTA = new Intl.DateTimeFormat('es-GT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
})

function fechaLegible(iso: string | undefined): string {
    if (!iso) return ''

    const fecha = new Date(iso)
    return Number.isNaN(fecha.getTime()) ? '' : FECHA_CORTA.format(fecha)
}

export function etiquetaVersion(ficha: FichaSummary): string {
    const numero = `Versión ${String(ficha.revision).padStart(2, '0')}`

    const marca = ficha.esVigente
        ? ' (actual)'
        : estadoDe(ficha) === ESTADO_PENDIENTE ? ' (pendiente)' : ''

    const fecha = fechaLegible(ficha.fechaCreacion)

    return `${numero}${marca}${fecha ? ` - ${fecha}` : ''}`
}

/** Conversión de las observaciones del formulario al contrato del servidor. */

import type { Observation } from '../../types/patient-api'
import {
    MAX_OBSERVACION,
    type ObservacionItem,
} from '../../components/forms/ObservationsSection/ObservationsSection'

export function observacionesParaEnviar(items: readonly ObservacionItem[]): Observation[] | undefined {
    const observaciones = items
        .map((item) => item.text.trim())
        .filter(Boolean)
        .map((texto) => ({ observationText: texto.slice(0, MAX_OBSERVACION) }))

    return observaciones.length > 0 ? observaciones : undefined
}

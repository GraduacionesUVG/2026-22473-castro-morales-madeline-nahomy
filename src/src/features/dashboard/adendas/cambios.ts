/** Conversión de la ficha de una adenda a la lista de cambios que se revisan. */

import type { DecisionCambio, FichaDetail } from '../../../services/ficha.service'

export type TipoCambio = 'SIGNO' | 'EXAMEN' | 'OBSERVACION'

export interface RegistroCambio {
    id: string
    titulo: string
    imagenUrl?: string
    chips: string[]
}

export interface CambioSolicitado {
    id: string
    tipo: TipoCambio
    etiqueta: string
    nuevo: RegistroCambio
    anterior?: RegistroCambio
}

export const ETIQUETA: Record<TipoCambio, string> = {
    SIGNO:       'Signo de alerta',
    EXAMEN:      'Estudio de gabinete',
    OBSERVACION: 'Observación',
}

export function cambiosDeAdenda(ficha: FichaDetail): CambioSolicitado[] {
    const signos = ficha.warningSigns
    const examenes = ficha.examDiagnoses

    const comoRegistro = (signo: FichaDetail['warningSigns'][number]): RegistroCambio => ({
        id: signo.signoId,
        titulo: signo.signDescription,
        imagenUrl: signo.imageUrl ?? undefined,
        chips: [signo.partName, signo.regionName].filter(Boolean),
    })

    const comoRegistroExamen = (examen: FichaDetail['examDiagnoses'][number]): RegistroCambio => ({
        id: examen.examenId,
        titulo: examen.examDescription,
        imagenUrl: examen.examUrl ?? undefined,
        chips: [],
    })

    const deSignos: CambioSolicitado[] = signos
        .filter((signo) => signo.addedInRevision)
        .map((alta) => {
            const anterior = signos.find((otro) =>
                otro.signoId !== alta.signoId &&
                (otro.replacedBySignoId === alta.signoId || otro.signoId === alta.replacesSignoId))

            return {
                id: alta.signoId,
                tipo: 'SIGNO' as const,
                etiqueta: ETIQUETA.SIGNO,
                nuevo: comoRegistro(alta),
                anterior: anterior ? comoRegistro(anterior) : undefined,
            }
        })

    const deExamenes: CambioSolicitado[] = examenes
        .filter((examen) => examen.addedInRevision)
        .map((alta) => {
            const anterior = examenes.find((otro) =>
                otro.examenId !== alta.examenId &&
                (otro.replacedByExamenId === alta.examenId || otro.examenId === alta.replacesExamenId))

            return {
                id: alta.examenId,
                tipo: 'EXAMEN' as const,
                etiqueta: ETIQUETA.EXAMEN,
                nuevo: comoRegistroExamen(alta),
                anterior: anterior ? comoRegistroExamen(anterior) : undefined,
            }
        })

    const deObservaciones: CambioSolicitado[] = (ficha.observations ?? [])
        .filter((observacion) => observacion.addedInRevision)
        .map((alta) => ({
            id: alta.observacionId,
            tipo: 'OBSERVACION' as const,
            etiqueta: ETIQUETA.OBSERVACION,
            nuevo: { id: alta.observacionId, titulo: alta.observationText, chips: [] },
        }))

    return [...deSignos, ...deExamenes, ...deObservaciones]
}

export type Decision = 'APROBADO' | 'RECHAZADO'

export type DecisionesPorCambio = Record<string, Decision | undefined>

export function decisionesCompletas(
    cambios: readonly CambioSolicitado[],
    decisiones: DecisionesPorCambio,
): boolean {
    if (cambios.length === 0) return false

    return cambios.every((cambio) => decisiones[cambio.id] !== undefined)
}

export function construirDecisiones(
    cambios: readonly CambioSolicitado[],
    decisiones: DecisionesPorCambio,
): DecisionCambio[] {
    return cambios.map((cambio) => {
        const decision = decisiones[cambio.id]
        if (!decision) throw new Error(`El cambio ${cambio.id} no tiene decisión.`)

        return { tipo: cambio.tipo, id: cambio.id, decision }
    })
}

export function contarAprobados(decisiones: DecisionCambio[]): number {
    return decisiones.filter((decision) => decision.decision === 'APROBADO').length
}

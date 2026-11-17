/** Cálculo del progreso de respuestas de la sección Otros Demográficos. */

import type { RespuestaTernaria } from '../../../types/ficha'

export interface DemographicAnswers {
    familiaresAfectados?: RespuestaTernaria | null
    menoresEnHogar?: number
    adultosEnHogar?: number
    quienAfectado?: string[]
    afectadosComunidad?: RespuestaTernaria | null
}

export function familiaresAfectadosVisible(value?: RespuestaTernaria | null): boolean {
    return value !== 0
}

export function hayConvivientes(menores?: number, adultos?: number): boolean {
    return (menores ?? 0) + (adultos ?? 0) > 0
}

export function demographicProgress(
    answers: DemographicAnswers,
): { filledCount: number; progressTotal: number } {
    const { familiaresAfectados, menoresEnHogar, adultosEnHogar, quienAfectado, afectadosComunidad } = answers

    if (!familiaresAfectadosVisible(familiaresAfectados)) {
        return {
            progressTotal: 2,
            filledCount: [
                familiaresAfectados != null,
                afectadosComunidad != null,
            ].filter(Boolean).length,
        }
    }

    return {
        progressTotal: 4,
        filledCount: [
            familiaresAfectados != null,
            hayConvivientes(menoresEnHogar, adultosEnHogar),
            (quienAfectado?.length ?? 0) > 0,
            afectadosComunidad != null,
        ].filter(Boolean).length,
    }
}

/** Servicio de sesiones de captura de la ficha (flujo SADC y flujo manual). */

import { apiFetch } from './api.client'
import type { Paciente } from '../types/patient'
import { localIsoDate } from '../features/ficha-provisional/provisional'

export interface SessionActivateResponse {
    fichaId: string
    sessionId: string
    origenCreacion: 'INTEGRACION' | 'MANUAL'
    alreadyActive: boolean
    paciente: {
        patientId: string
        externalId: string
        nombre: string
        historiaClinica?: string | null
        tenantId?: string | null
        historiaClinicaReferida?: string | null
    }
    consulta: {
        fechaConsulta: string
        diagnosticoTexto: string
    }
    medico: {
        medicoId: string
        medicoExtId: string
        nombre: string
        especialidad: string
    }
}

interface SessionInitResponse {
    sessionToken: string
    formUrl: string
    expiresIn: number
}

export async function createManualSession(
    paciente: Paciente,
    accessToken: string,
): Promise<SessionInitResponse> {
    return apiFetch<SessionInitResponse>('/api/v1/sessions/manual', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            paciente: {
                historiaClinica: paciente.historiaClinica,
                tenantId: String(paciente.idTenant),
                nombre: paciente.nombreCompleto,
            },
            consulta: {
                fechaConsulta: localIsoDate(),
                diagnosticoTexto: '',
            },
        }),
        sensitive: true,
    })
}

export interface ProvisionalSessionInput {
    historiaClinica: string
    tenantId: string
    nombre: string
    fechaConsulta: string
}

export async function createProvisionalSession(
    input: ProvisionalSessionInput,
    accessToken: string,
): Promise<SessionInitResponse> {
    return apiFetch<SessionInitResponse>('/api/v1/sessions/manual', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            provisional: true,
            paciente: {
                historiaClinica: input.historiaClinica,
                tenantId: input.tenantId,
                nombre: input.nombre,
            },
            consulta: {
                fechaConsulta: input.fechaConsulta,
            },
        }),
        sensitive: true,
    })
}

export function activateSession(): Promise<SessionActivateResponse> {
    return apiFetch<SessionActivateResponse>(
        '/api/v1/sessions/activate',
        { method: 'POST', sensitive: true },
    )
}

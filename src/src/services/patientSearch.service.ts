/** Servicio de búsqueda de pacientes de SADC a través de la API de CONGENIA. */

import { apiFetch, ApiError } from './api.client'
import type { Paciente } from '../types/patient'

const TIMEOUT_MS = 25_000

export class PatientSearchError extends Error {
    readonly status: number

    constructor(status: number, message: string) {
        super(message)
        this.name = 'PatientSearchError'
        this.status = status
    }
}

export interface PatientSearchParams {
    historiaClinica: string
    idTenant: string
}

interface SadcPaciente {
    idPaciente:      number | string | null
    idInstitucion:   number | string
    historiaClinica: string
    nombres:         string
    apellidos:       string
}

interface SadcPacienteResponse {
    success: boolean
    data:    SadcPaciente
}

function toPaciente(origen: SadcPaciente): Paciente {
    return {
        id:              Number(origen.idPaciente),
        idTenant:        Number(origen.idInstitucion),
        nombreCompleto:  `${origen.nombres} ${origen.apellidos}`.trim(),
        historiaClinica: origen.historiaClinica,
    }
}

function toSearchError(err: ApiError): PatientSearchError {
    switch (err.status) {
        case 404:
            return new PatientSearchError(404, 'No se encontró historia clínica')
        case 401:
        case 403:
            return new PatientSearchError(err.status, 'No tiene autorización para consultar pacientes de esta institución.')
        case 408:
        case 504:
            return new PatientSearchError(408, 'La búsqueda superó el tiempo límite. Intente de nuevo.')
        case 0:
            return new PatientSearchError(0, 'No se pudo conectar con el servidor. Revise su conexión.')
        default:
            return new PatientSearchError(err.status, err.status === 503
                ? 'El SADC no está disponible en este momento. Intente de nuevo.'
                : `Error del servidor (HTTP ${err.status}).`)
    }
}

export async function searchPatient({
    historiaClinica,
    idTenant,
}: PatientSearchParams): Promise<Paciente> {
    const query = new URLSearchParams({
        idTenant:        String(idTenant),
        historiaClinica: historiaClinica.trim(),
    })

    try {
        const response = await apiFetch<SadcPacienteResponse>(`/api/v1/sadc/pacientes?${query}`, {
            auth:      'bearer',
            sensitive: true,
            timeoutMs: TIMEOUT_MS,
        })
        return toPaciente(response.data)
    } catch (err) {
        if (err instanceof ApiError) throw toSearchError(err)
        throw err
    }
}

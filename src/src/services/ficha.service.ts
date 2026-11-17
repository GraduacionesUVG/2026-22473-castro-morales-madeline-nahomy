/** Servicio de fichas registradas, revisiones y adendas. */

import { apiFetch } from './api.client'
import { APP_ENV, USE_ADENDAS_MOCK } from '../config/runtime'
import type { WarningSign, ExamDiagnosis, Observation } from '../types/patient-api'
import { listarAdendasMock, obtenerAdendaMock, resolverAdendaMock } from './adendas.mock'

export interface TenantOption {
    id: string
    name: string
    label: string
}

export interface MeTenantAccess {
    tenantId: number
    funciones: string[]
    permissions: string[]
    name?: string
    label?: string
}

export interface MeProfile {
    subject: string
    displayName: string
    especialidad: string
    roles: string[]
    roleLabel?: string | null
    permissions?: string[]
    globalPermissions?: string[]
    access?: MeTenantAccess[]
    tenants: string[]
    tenantOptions?: TenantOption[]
}

export interface FichaSummary {
    fichaId: string
    fichaRaizId: string
    revision: number
    estado: string
    estadoFicha: string
    fechaConsulta: string
    esVigente: boolean
    medico: string
    historiaClinica?: string
    provisional?: boolean
    fechaCreacion?: string
}

export type EstadoAdenda = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA'

export interface StoredWarningSign {
    signoId: string
    signDescription: string
    partCatalogId: number
    partName: string
    regionId: number
    regionName: string
    imageUrl?: string | null
    addedInRevision: boolean
    replacedBySignoId?: string | null
    replacesSignoId?: string | null
}
export interface StoredExam {
    examenId: string
    examDescription: string
    examUrl?: string | null
    addedInRevision: boolean
    replacedByExamenId?: string | null
    replacesExamenId?: string | null
}
export interface StoredObservation {
    observacionId: string
    observationText: string
    addedInRevision: boolean
    fechaCreacion?: string
}
export interface FichaDetail {
    fichaId: string
    pacienteId: string
    fichaRaizId: string
    revision: number
    estadoFicha: string
    estadoRevision?: EstadoAdenda
    esVigente: boolean
    motivoSolicitud?: string | null
    fechaCreacion?: string
    paciente: { nombre: string; historiaClinica: string; tenantId: string }
    consulta: { fechaConsulta: string; diagnosticoTexto: string }
    medico: { nombre: string; especialidad: string }
    demographic: {
        referralSourceId: number | null
        birthMethodId: number | null
        sexId?: number | null
        affectedRelatives: boolean | null
        affectedRelativesCategoryIds: number[]
        affectedUnderageRelatives: number
        affectedAdultRelatives: number
        affectedCommunityMembers: 'SI' | 'NO' | 'DESCONOCIDO' | null
    }
    consent: {
        consentimientoId: string
        tipoFirmante: string
        nombreFirmante: string
        idiomaConsentimiento: string
        aceptacionTerminos: boolean
        aceptacionContacto: boolean
        fechaHoraAceptacion: string
        firmaEvidenciaTecnica?: Record<string, unknown>
        firmaUrl?: string | null
        pdfUrl?: string | null
        estadoConsentimiento: string
        medico?: { nombre: string; especialidad: string }
    } | null
    warningSigns: StoredWarningSign[]
    examDiagnoses: StoredExam[]
    observations?: StoredObservation[]
}
export interface PendingFicha extends Omit<FichaSummary, 'estado'> {
    pacienteId: string
    motivoSolicitud: string
    fechaCreacion: string
    paciente: FichaDetail['paciente']
}
export interface RevisionWarningSign extends WarningSign {
    replacesSignoId?: string
}
export interface RevisionExam extends ExamDiagnosis {
    replacesExamenId?: string
}
export interface RevisionPayload {
    motivo: string
    warningSigns: RevisionWarningSign[]
    examDiagnoses: RevisionExam[]
    observations?: Observation[]
}
export interface RevisionResult { fichaId: string; revision: number; estadoFicha: string }

export interface AdendaResumen {
    fichaId: string
    fichaRaizId: string
    revision: number
    estadoRevision: EstadoAdenda
    fechaSolicitud: string
    medicoSolicitante: string
    motivoSolicitud: string
    paciente: FichaDetail['paciente']
}

export interface AdendaSearchParams {
    estado: EstadoAdenda
    q?: string
    desde?: string
    hasta?: string
    page?: number
    pageSize?: number
}

export interface AdendaSearchResult {
    items: AdendaResumen[]
    total: number
    page: number
    pageSize: number
}

export interface DecisionCambio {
    tipo: 'SIGNO' | 'EXAMEN' | 'OBSERVACION'
    id: string
    decision: 'APROBADO' | 'RECHAZADO'
}

export const ADENDAS_PAGE_SIZE = 12

const USE_MOCK = USE_ADENDAS_MOCK
    ? ['1', 'true', 'yes', 'on'].includes(USE_ADENDAS_MOCK.trim().toLowerCase())
    : ['development', 'dev', 'test'].includes(APP_ENV.trim().toLowerCase())

function buildAdendasQuery({ estado, q, desde, hasta, page, pageSize }: AdendaSearchParams): string {
    const params = new URLSearchParams()

    params.set('estado', estado)
    if (q?.trim()) params.set('q', q.trim())
    if (desde) params.set('desde', desde)
    if (hasta) params.set('hasta', hasta)
    params.set('page', String(page ?? 1))
    params.set('pageSize', String(pageSize ?? ADENDAS_PAGE_SIZE))

    return params.toString()
}

export async function listarAdendas(params: AdendaSearchParams): Promise<AdendaSearchResult> {
    if (USE_MOCK) return listarAdendasMock(params)

    return apiFetch<AdendaSearchResult>(`/api/v1/fichas/adendas?${buildAdendasQuery(params)}`, readOptions)
}

export async function obtenerAdenda(fichaId: string): Promise<FichaDetail> {
    if (USE_MOCK) return obtenerAdendaMock(fichaId)

    return getFicha(fichaId)
}

export async function resolverAdenda(fichaId: string, decisiones: DecisionCambio[]): Promise<RevisionResult> {
    if (USE_MOCK) return resolverAdendaMock(fichaId, decisiones)

    return apiFetch<RevisionResult>(`${fichaPath(fichaId)}/resolver`, {
        ...readOptions,
        method: 'POST',
        body: JSON.stringify({ decisiones }),
    })
}

const readOptions = { auth: 'bearer', sensitive: true } as const
const fichaPath = (id: string) => `/api/v1/fichas/${encodeURIComponent(id)}`

export const getMe = () => apiFetch<MeProfile>('/api/v1/me', readOptions)
export const listFichasPaciente = (tenantId: string, historiaClinica: string) =>
    apiFetch<FichaSummary[]>(`/api/v1/pacientes/${encodeURIComponent(tenantId)}/${encodeURIComponent(historiaClinica)}/fichas`, readOptions)
export const getFicha = (id: string) => apiFetch<FichaDetail>(fichaPath(id), readOptions)
export const listarPendientes = () => apiFetch<PendingFicha[]>('/api/v1/fichas/pendientes', readOptions)
export const crearRevision = (id: string, payload: RevisionPayload) =>
    apiFetch<RevisionResult>(`${fichaPath(id)}/revisiones`, { ...readOptions, method: 'POST', body: JSON.stringify(payload) })
export const aprobar = (id: string) =>
    apiFetch<RevisionResult>(`${fichaPath(id)}/aprobar`, { ...readOptions, method: 'POST' })
export const rechazar = (id: string, motivo: string) =>
    apiFetch<RevisionResult>(`${fichaPath(id)}/rechazar`, { ...readOptions, method: 'POST', body: JSON.stringify({ motivo }) })

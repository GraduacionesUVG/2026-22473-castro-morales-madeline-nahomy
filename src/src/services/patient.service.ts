/** Servicio de registro de la ficha clínica (POST /v1/patient). */

import { apiFetch } from './api.client'
import type { FichaFormState } from '../features/ficha-clinica/fichaClinica.mapper'
import { observacionesParaEnviar } from '../features/ficha-clinica/observaciones'
import type { AlertSignItem } from '../components/forms/AlertSignsSection/AlertSignsSection'
import type { ExamItem } from '../components/forms/ExamsSection/ExamsSection'
import { consentContent } from '../components/forms/InformedConsentView/InformedConsentContent'
import type {
    PatientRegistrationPayload,
    PatientRegistrationResponse,
    TipoFirmante,
    AfectadoComunidad,
    WarningSign,
    ExamDiagnosis,
    ConsentPayload,
} from '../types/patient-api'

const TIPO_FIRMANTE: Record<string, TipoFirmante> = {
    'Padre':       'PADRE',
    'Madre':       'MADRE',
    'Tutor legal': 'TUTOR',
}

const COMUNIDAD_MAP: Record<number, AfectadoComunidad> = {
    0: 'NO',
    1: 'SI',
    2: 'DESCONOCIDO',
}

async function sha256Hex(text: string): Promise<string | null> {
    const subtle = globalThis.crypto?.subtle
    if (!subtle) {
        console.warn('[CONGENIA] Web Crypto no está disponible; se omite canvasHash')
        return null
    }

    const encoded = new TextEncoder().encode(text)
    const hashBuffer = await subtle.digest('SHA-256', encoded)
    return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
}

async function buildFirmaEvidenciaTecnica(
    signatureBase64: string | null,
    consentValues: Record<string, boolean>,
): Promise<Record<string, unknown>> {
    const declaraciones = consentContent.consentCards.map((card) => ({
        titulo:      card.title,
        descripcion: card.description,
        aceptada:    consentValues[card.id] ?? false,
        obligatoria: card.required,
    }))

    return {
        timestamp:  new Date().toISOString(),
        userAgent:  navigator.userAgent,
        source:     'canvas-pad',
        canvasHash: signatureBase64 ? await sha256Hex(signatureBase64) : null,
        declaraciones,
        version_texto_legal: 'CONSENTIMIENTO_V1',
    }
}

function mapWarningSigns(items: AlertSignItem[]): WarningSign[] {
    return items
        .filter((item) => item.parteDelCuerpo !== undefined)
        .map((item) => ({
            signDescription: item.title.trim().slice(0, 300),
            partCatalogId:   parseInt(item.parteDelCuerpo!.parteValue, 10),
            imageResourceId: item.imageResourceId,
        }))
}

function mapExamDiagnoses(items: ExamItem[]): ExamDiagnosis[] {
    return items.map((item) => ({
        examDescription: item.title.trim().slice(0, 300),
        examResourceId:  item.imageResourceId,
    }))
}

async function mapConsent(form: FichaFormState): Promise<ConsentPayload> {
    const firmaEvidenciaTecnica = await buildFirmaEvidenciaTecnica(
        form.signatureData,
        form.consentValues,
    )

    return {
        tipoFirmante:         TIPO_FIRMANTE[form.signerRelation] ?? 'MADRE',
        nombreFirmante:       form.signerName.trim(),
        idiomaConsentimiento: 'ESPANOL',
        aceptacionTerminos:   Boolean(
            form.consentValues['autorizacion-principal'] &&
            form.consentValues['aceptacion-final']
        ),
        aceptacionContacto:   form.consentValues['contacto-futuro'] ?? false,
        firmaEvidenciaTecnica,
        firmaPng:             form.signatureData ?? '',
    }
}

async function buildPatientPayload(form: FichaFormState): Promise<PatientRegistrationPayload> {
    const ternaria = form.familiaresAfectados ?? 0

    const consent = await mapConsent(form)
    const observations = observacionesParaEnviar(form.observaciones)

    return {
        referralSourceId:             parseInt(form.referidoDe, 10),
        birthMethodId:                form.lugarDeParto ? parseInt(form.lugarDeParto, 10) : null,
        sexId:                        parseInt(form.sexo, 10),
        affectedRelatives:            ternaria !== 0,
        affectedRelativesCategoryIds: form.quienAfectado.map((id) => parseInt(id, 10)),
        affectedUnderageRelatives:    form.menoresEnHogar,
        affectedAdultRelatives:       form.adultosEnHogar,
        affectedCommunityMembers:     COMUNIDAD_MAP[form.afectadosComunidad ?? 0],
        warningSigns:                 mapWarningSigns(form.alertSigns),
        examDiagnoses:                mapExamDiagnoses(form.exams),
        ...(observations ? { observations } : {}),
        consent,
    }
}

export async function registerPatient(
    form: FichaFormState,
): Promise<PatientRegistrationResponse> {
    const payload = await buildPatientPayload(form)

    return apiFetch<PatientRegistrationResponse>('/v1/patient', {
        method:    'POST',
        body:      JSON.stringify(payload),
        sensitive: true,
    })
}

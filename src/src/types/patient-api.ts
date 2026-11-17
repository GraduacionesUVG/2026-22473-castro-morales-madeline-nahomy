/** Tipos del contrato POST /v1/patient. */

export type TipoFirmante = 'PADRE' | 'MADRE' | 'TUTOR' | 'REPRESENTANTE_LEGAL'

export type IdiomaConsentimiento = 'ESPANOL' | 'QEQCHI' | 'IXIL'

export type AfectadoComunidad = 'SI' | 'NO' | 'DESCONOCIDO'

export interface WarningSign {
    signDescription: string
    partCatalogId:   number
    imageResourceId?: string
}

export interface ExamDiagnosis {
    examDescription: string
    examResourceId?: string
}

export interface Observation {
    observationText: string
}

export interface ConsentPayload {
    tipoFirmante:         TipoFirmante
    nombreFirmante:       string
    idiomaConsentimiento: IdiomaConsentimiento
    aceptacionTerminos:   boolean
    aceptacionContacto:   boolean
    firmaEvidenciaTecnica: Record<string, unknown>
    firmaPng:             string
}

export interface PatientRegistrationPayload {
    referralSourceId:             number
    birthMethodId:                number | null
    sexId:                        number
    affectedRelatives:            boolean
    affectedRelativesCategoryIds: number[]
    affectedUnderageRelatives:    number
    affectedAdultRelatives:       number
    affectedCommunityMembers:     AfectadoComunidad
    warningSigns:                 WarningSign[]
    examDiagnoses:                ExamDiagnosis[]
    observations?:                Observation[]
    consent:                      ConsentPayload
}

export interface PatientRegistrationResponse {
    fichaId:          string
    consentimientoId: string
    fechaHoraAceptacion?: string
}

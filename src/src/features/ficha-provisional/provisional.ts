/** Ficha provisional para pacientes cuya historia clínica no existe en SADC. */

const PREFIJO = 'TMP-'

export const AVISO_REGISTRO_MANUAL =
    'Paciente registrado manualmente: no se encontró en SADC. La historia clínica asignada es provisional y se actualizará al consolidarse el registro.'

export function isProvisionalHistory(historiaClinica: string | null | undefined): boolean {
    return typeof historiaClinica === 'string' && historiaClinica.trim().toUpperCase().startsWith(PREFIJO)
}

export function provisionalHistoryFor(tenantId: string, historiaClinica: string): string {
    return `${PREFIJO}${tenantId}-${historiaClinica.trim()}`
}

export function localIsoDate(now: Date = new Date()): string {
    return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

export interface ManualRegistrationValues {
    nombre: string
    fechaConsulta: string
}

export interface ManualRegistrationErrors {
    nombre?: string
    fechaConsulta?: string
}

const NOMBRE_MAX = 200

export function validateManualRegistration(
    values: ManualRegistrationValues,
    hoy: string = localIsoDate(),
): ManualRegistrationErrors {
    const errors: ManualRegistrationErrors = {}
    const nombre = values.nombre.trim()

    if (nombre === '') errors.nombre = 'Escriba el nombre completo del paciente.'
    else if (nombre.length > NOMBRE_MAX) errors.nombre = `El nombre admite hasta ${NOMBRE_MAX} caracteres.`

    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.fechaConsulta)) errors.fechaConsulta = 'Seleccione la fecha de consulta.'
    else if (values.fechaConsulta > hoy) errors.fechaConsulta = 'La fecha de consulta no puede ser futura.'

    return errors
}

export function manualRegistrationErrorMessage(code: string | undefined): string | null {
    switch (code) {
        case 'PACIENTE_EXISTE_EN_SADC':
            return 'Esta historia clínica sí existe en SADC. Vuelva a la búsqueda e intente de nuevo.'
        case 'SADC_UNAVAILABLE':
            return 'No se pudo verificar la historia clínica en SADC. Intente de nuevo en unos minutos.'
        case 'FICHA_VIGENTE_EXISTE':
            return 'Ya existe una ficha para esta historia clínica. Vuelva a la búsqueda para abrirla.'
        case 'INVALID_HISTORIA_CLINICA':
            return 'La historia clínica solo admite letras, números y guiones.'
        case 'INVALID_FECHA_CONSULTA':
            return 'La fecha de consulta no es válida.'
        default:
            return null
    }
}

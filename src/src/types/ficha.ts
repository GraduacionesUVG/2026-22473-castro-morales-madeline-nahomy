/** Tipos de la ficha clínica. */

export type ReferidoDe =
  | 'primer_nivel_salud'
  | 'comadrona'
  | 'medico_privado'
  | 'otro'

export type LugardeParto =
  | 'comadrona'
  | 'primer_nivel'
  | 'segundo_nivel'
  | 'hospital_local'
  | 'otro'

export interface DiagnosticoConsulta {
    id: number
    nombre: string
}

export interface DatosConsulta {
    fechaConsulta: string
    idConsulta: number
    especialidad: string
    diagnosticos: DiagnosticoConsulta[]
    referidoDe: ReferidoDe | null
    lugarDeParto: LugardeParto | null
    sexo: string | null
}

export type FamiliarAfectado =
  | 'madre'
  | 'padre'
  | 'hermano'
  | 'hermana'
  | 'abuela_materna'
  | 'abuelo_materno'
  | 'tia_materna'
  | 'tio_materno'
  | 'prima_materna'
  | 'primo_materno'
  | 'abuela_paterna'
  | 'abuelo_paterno'
  | 'tia_paterna'
  | 'tio_paterno'
  | 'prima_paterna'
  | 'primo_paterno'
  | 'otro_familiar'
  | 'desconoce'

export type RespuestaTernaria = 0 | 1 | 2

export interface OtrosDemograficos {
    familiaresAfectados: RespuestaTernaria
    menoresEnHogar: number
    adultosEnHogar: number
    quienAfectado: FamiliarAfectado[]
    afectadosComunidad: RespuestaTernaria
}

export type RegionAnatomica =
  | 'cabeza_cuello'
  | 'tronco'
  | 'extremidades_superiores'
  | 'extremidades_inferiores'
  | 'genitales_perine'
  | 'general_otro'

export type Lateralidad =
  | 'izquierda'
  | 'derecha'
  | 'bilateral'

export interface ParteSeleccionada {
    regionValue: RegionAnatomica
    parteValue: string
    lateralidad?: Lateralidad
}

export interface SignoAlerta {
    id: string
    nombre: string
    parteDelCuerpo: ParteSeleccionada
    nombreArchivo: string
    imagenBase64: string
}

export interface EstudiosIndicados {
    id: string
    nombre: string
    nombreArchivo?: string
    imagenBase64?: string
}

export interface Observacion {
    id: string
    texto: string
}

export type RelacionFirmante =
  | 'padre'
  | 'madre'
  | 'tutor_legal'

export interface DeclaracionConsentimiento {
    id: string
    titulo: string
    descripcion: string
    obligatoria: boolean
    aceptada: boolean
}

export interface DatosFirmante {
    nombreCompleto: string
    relacion: RelacionFirmante
}

export interface Consentimiento {
    declaraciones: DeclaracionConsentimiento[]
    firmante: DatosFirmante | null
    firmaBase64: string | null
    completado: boolean
    fechaFirma?: string
    codigoDocumento?: string
}

export interface ProgresoFicha {
    datosConsulta: boolean
    otrosDemograficos: boolean
    consentimiento: boolean
}

export interface FichaClinica {
    idConsulta: number
    idTenant: number
    estado: 'borrador' | 'finalizado'
    progreso: ProgresoFicha
    ultimaModificacion: string

    datosConsulta: DatosConsulta
    otrosDemograficos: OtrosDemograficos
    signosAlerta: SignoAlerta[]
    examenesSugeridos: EstudiosIndicados[]
    observaciones: Observacion[]
    consentimiento: Consentimiento
}
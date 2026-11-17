/** Tipos de búsqueda y lectura de fichas registradas. */

import type {
    FamiliarAfectado,
    ParteSeleccionada,
    RespuestaTernaria,
} from './ficha'

export interface FichaResumen {
    fichaId: string
    nombrePaciente: string
    fechaConsulta: string
    historiaClinica: string
    idTenant: number
}

export interface FichaSearchParams {
    q?: string
    desde?: string
    hasta?: string
    page?: number
    pageSize?: number
}

export interface FichaSearchResult {
    items: FichaResumen[]
    total: number
    page: number
    pageSize: number
}

export interface OpcionSeleccionada {
    value: string
    label: string
}

export interface SignoAlertaDetalle {
    id: string
    nombre: string
    parteDelCuerpo: ParteSeleccionada
    parteDelCuerpoLabel?: string
    imagenUrl?: string
}

export interface EstudioIndicadoDetalle {
    id: string
    nombre: string
    imagenUrl?: string
    nombreArchivo?: string
}

export interface ObservacionDetalle {
    id: string
    texto: string
    fecha?: string
}

export interface DatosConsultaDetalle {
    fechaConsulta: string
    medicoConsulta: string
    especialidad: string
    diagnosticos: string
    referidoDe: OpcionSeleccionada | null
    lugarDeParto: OpcionSeleccionada | null
    sexo?: OpcionSeleccionada | null
}

export interface OtrosDemograficosDetalle {
    familiaresAfectados: RespuestaTernaria | null
    menoresEnHogar: number
    adultosEnHogar: number
    quienAfectado: FamiliarAfectado[]
    afectadosComunidad: RespuestaTernaria | null
}

export interface FichaDetalle {
    fichaId: string
    nombrePaciente: string
    historiaClinica: string
    idTenant: number
    datosConsulta: DatosConsultaDetalle
    otrosDemograficos: OtrosDemograficosDetalle
    signosAlerta: SignoAlertaDetalle[]
    examenesSugeridos: EstudioIndicadoDetalle[]
    observaciones?: ObservacionDetalle[]
}

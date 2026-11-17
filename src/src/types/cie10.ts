/** Tipos de la revisión CIE-10 por lote. */

export interface OpcionCie10 {
    codigo: string
    descripcionModelo: string
    codigoInternoCatalogo: string | null
    nombreCatalogo: string
    razonamiento?: string | null
    soporte?: 'VALIDADO_INSTITUCIONAL' | 'REFERENCIA_EXTERNA' | 'REQUIERE_ATENCION'
    confianza?: 'ALTA' | 'MEDIA' | 'BAJA'
    distanciaRag?: number | null
    informacionFaltante?: string[]
}

export interface SugerenciaCie10 {
    runId?: string
    codigoTraductor: string
    diagnostico: string
    cie10Original: string
    sugerencias: OpcionCie10[]
    razonamientoClinico: string | null
    error: string | null
    modelo: string
    procesadoEn: string
    ragVersion?: string | null
}

export interface ItemLoteCie10 extends SugerenciaCie10 {
    status: 'AUTOCODIFICADO' | 'CORREGIDO_POR_MEDICO' | 'REQUIERE_ATENCION' | 'CONFIRMADO'
    principal: OpcionCie10 | null
    finalCode: string
    corrected: boolean
    correctionComment: string | null
    reviewed?: boolean
}

export type ConfianzaCie10 = NonNullable<OpcionCie10['confianza']>

export interface FiltrosLoteCie10 {
    confianza?: ConfianzaCie10
    q?: string
}

export interface ConteosLoteCie10 {
    pendientes: number
}

export type EstadoLoteCie10 = 'PENDIENTE_REVISION' | 'CONFIRMADO'

export type FiltroLotesCie10 = 'PENDIENTES' | 'REVISADOS'

export interface ResumenLoteCie10 {
    runId: string
    periodo: string
    status: EstadoLoteCie10
    finishedAt: string | null
    total: number
    pendientes: number
    confirmedAt: string | null
}

export interface PaginaLotesCie10 {
    items: ResumenLoteCie10[]
    total: number
    page: number
    pageSize: number
    counts: { pendientes: number; revisados: number }
}

export interface LoteCie10 {
    runId: string
    periodo?: string
    status: EstadoLoteCie10
    ragVersion: string | null
    model: string
    finishedAt: string | null
    clause: { version: string; text: string }
    clauseAccepted: boolean
    clauseAcceptedAt: string | null
    confirmed: boolean
    confirmedAt: string | null
    items: ItemLoteCie10[]
    total: number
    page: number
    pageSize: number
    counts?: ConteosLoteCie10
}

export interface AceptacionLotePayload {
    codigo: string
    posicion: number
    sugerenciasMostradas: number
}

export interface AceptacionMasivaItem extends AceptacionLotePayload {
    codigoTraductor: string
}

export interface CorreccionLotePayload {
    codigo: string
    sugerenciasMostradas?: number
    fueraDeCatalogo?: boolean
}

export interface RevisionItemLote {
    codigoTraductor: string
    codigoFinal: string
    comentario: string | null
    corrected: boolean
    updatedAt: string
}

export interface ConfirmacionLoteCie10 {
    runId: string
    confirmed: true
    total: number
}

export interface CatalogoCie10Item {
    codigo: string
    descripcion: string
    codigoInterno: string | null
    enCatalogoInstitucional: boolean
    enReferenciaExterna: boolean
}

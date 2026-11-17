/** Servicio de catálogos de referencia de la API. */

import { apiFetch } from './api.client'

export interface CatRegionAnatomica {
    region_id: number
    nombre: string
    orden: number
    activo: boolean
}

export interface CatLateralidad {
    lateralidad_id: number
    codigo: string
    nombre: string
    orden: number
    activo: boolean
}

export interface CatParteCuerpo {
    parte_id: number
    region_id: number
    nombre: string
    orden: number
    requiere_lateralidad: boolean
    permite_linea_media: boolean
    activo: boolean
}

export interface CatSigno {
    signo_catalogo_id: number
    nombre_normalizado: string
    categoria: string
    descripcion_medica: string
    activo: boolean
}

export interface CatExamen {
    examen_catalogo_id: number
    nombre_normalizado: string
    tipo: string
    descripcion: string
    activo: boolean
}

export interface CatAsistenciaParto {
    asistencia_parto_id: number
    nombre: string
}

export interface CatReferidoDe {
    referido_de_id: number
    nombre: string
}

export interface CatFamiliar {
    familiar_catalogo_id: number
    nombre: string
}

export interface CatSexo {
    sexo_id: number
    codigo: 'M' | 'F' | 'I'
    nombre: string
}

export interface CatParteCuerpoAgrupada {
    regionId: number
    region:   string
    orden:    number
    partes: Array<{
        parteId:             number
        nombre:              string
        orden:               number
        requiereLateralidad: boolean
        permiteLineaMedia:   boolean
    }>
}

export const getRegiones              = () => apiFetch<CatRegionAnatomica[]>('/v1/Regiones')
export const getLateralidades         = () => apiFetch<CatLateralidad[]>('/v1/Lateralidades')
export const getPartesCuerpo          = () => apiFetch<CatParteCuerpo[]>('/v1/PartesCuerpo')
export const getPartesCuerpoAgrupadas = () => apiFetch<CatParteCuerpoAgrupada[]>('/v1/PartesCuerpo?groupBy=region')
export const getSignos                = () => apiFetch<CatSigno[]>('/v1/Signos')
export const getExamenes              = () => apiFetch<CatExamen[]>('/v1/Examenes')
export const getAsistenciaParto       = () => apiFetch<CatAsistenciaParto[]>('/v1/AsistenciaParto')
export const getReferidoDe            = () => apiFetch<CatReferidoDe[]>('/v1/ReferidoDe')
export const getFamiliares            = () => apiFetch<CatFamiliar[]>('/v1/Familiares')
export const getSexos                 = () => apiFetch<CatSexo[]>('/v1/Sexos')
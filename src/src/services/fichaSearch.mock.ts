/** Datos de prueba de la búsqueda de fichas para desarrollo sin backend. */

import type {
    FichaDetalle,
    FichaResumen,
    FichaSearchParams,
    FichaSearchResult,
} from '../types/ficha-search'
import { ApiError } from './api.client'

const LATENCIA_MS = 350

export const DIAS_VENTANA_POR_DEFECTO = 30

function isoLocal(fecha: Date): string {
    const mes = String(fecha.getMonth() + 1).padStart(2, '0')
    const dia = String(fecha.getDate()).padStart(2, '0')
    return `${fecha.getFullYear()}-${mes}-${dia}`
}

function haceDias(dias: number): string {
    const fecha = new Date()
    fecha.setDate(fecha.getDate() - dias)
    return isoLocal(fecha)
}

const ANTIGUEDAD_DIAS = [2, 5, 9, 14, 21, 28, 36, 49, 64, 81, 105, 131, 161, 196, 241]

export const MOCK_FICHAS: readonly FichaResumen[] = [
    { fichaId: 'f-001', nombrePaciente: 'Rachel Castro Morales',     fechaConsulta: haceDias(ANTIGUEDAD_DIAS[0]), historiaClinica: '00445566777', idTenant: 23 },
    { fichaId: 'f-002', nombrePaciente: 'Diego Armando Ruiz',        fechaConsulta: haceDias(ANTIGUEDAD_DIAS[1]), historiaClinica: '00445566778', idTenant: 23 },
    { fichaId: 'f-003', nombrePaciente: 'María José Xoc Chávez',     fechaConsulta: haceDias(ANTIGUEDAD_DIAS[2]), historiaClinica: '00445566779', idTenant: 23 },
    { fichaId: 'f-004', nombrePaciente: 'Luis Fernando Pérez',       fechaConsulta: haceDias(ANTIGUEDAD_DIAS[3]), historiaClinica: '00445566780', idTenant: 17 },
    { fichaId: 'f-005', nombrePaciente: 'Ana Lucía Menchú',          fechaConsulta: haceDias(ANTIGUEDAD_DIAS[4]), historiaClinica: '00445566781', idTenant: 17 },
    { fichaId: 'f-006', nombrePaciente: 'Carlos Estuardo Godoy',     fechaConsulta: haceDias(ANTIGUEDAD_DIAS[5]), historiaClinica: '00445566782', idTenant: 23 },
    { fichaId: 'f-007', nombrePaciente: 'Sofía Isabel Ramírez',      fechaConsulta: haceDias(ANTIGUEDAD_DIAS[6]), historiaClinica: '00445566783', idTenant: 41 },
    { fichaId: 'f-008', nombrePaciente: 'Josué Alejandro Tzoc',      fechaConsulta: haceDias(ANTIGUEDAD_DIAS[7]), historiaClinica: '00445566784', idTenant: 41 },
    { fichaId: 'f-009', nombrePaciente: 'Valeria Nicole Herrera',    fechaConsulta: haceDias(ANTIGUEDAD_DIAS[8]), historiaClinica: '00445566785', idTenant: 23 },
    { fichaId: 'f-010', nombrePaciente: 'Mateo Sebastián Arriola',   fechaConsulta: haceDias(ANTIGUEDAD_DIAS[9]), historiaClinica: '00445566786', idTenant: 17 },
    { fichaId: 'f-011', nombrePaciente: 'Camila Andrea Batz',        fechaConsulta: haceDias(ANTIGUEDAD_DIAS[10]), historiaClinica: '00445566787', idTenant: 23 },
    { fichaId: 'f-012', nombrePaciente: 'Emilio Rodrigo Salazar',    fechaConsulta: haceDias(ANTIGUEDAD_DIAS[11]), historiaClinica: '00445566788', idTenant: 41 },
    { fichaId: 'f-013', nombrePaciente: 'Gabriela Mishell Coy',      fechaConsulta: haceDias(ANTIGUEDAD_DIAS[12]), historiaClinica: '00445566789', idTenant: 17 },
    { fichaId: 'f-014', nombrePaciente: 'Andrés Felipe Marroquín',   fechaConsulta: haceDias(ANTIGUEDAD_DIAS[13]), historiaClinica: '00445566790', idTenant: 23 },
    { fichaId: 'f-015', nombrePaciente: 'Renata Alejandra Ixcot',    fechaConsulta: haceDias(ANTIGUEDAD_DIAS[14]), historiaClinica: '00445566791', idTenant: 41 },
]

function normalizar(texto: string): string {
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
}

function tokens(texto: string): string[] {
    return normalizar(texto).split(/\s+/).filter(Boolean)
}

function coincideNombre(nombre: string, buscados: string[]): boolean {
    const presentes = new Set(tokens(nombre))
    return buscados.every((palabra) => presentes.has(palabra))
}

export function filterFichas(
    items: readonly FichaResumen[],
    { q, desde, hasta }: FichaSearchParams,
): FichaResumen[] {
    const termino = q?.trim() ?? ''
    const buscados = termino ? tokens(termino) : []

    return items.filter((ficha) => {
        if (buscados.length > 0) {
            const coincide =
                coincideNombre(ficha.nombrePaciente, buscados) ||
                ficha.historiaClinica.includes(termino)
            if (!coincide) return false
        }

        if (desde && ficha.fechaConsulta < desde) return false
        if (hasta && ficha.fechaConsulta > hasta) return false

        return true
    })
}

export function paginate<T>(items: readonly T[], page: number, pageSize: number): T[] {
    const inicio = (page - 1) * pageSize
    return items.slice(inicio, inicio + pageSize)
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function searchFichasMock(params: FichaSearchParams = {}): Promise<FichaSearchResult> {
    await delay(LATENCIA_MS)

    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 12

    const conVentana: FichaSearchParams =
        params.desde || params.hasta
            ? params
            : { ...params, desde: haceDias(DIAS_VENTANA_POR_DEFECTO) }

    const filtradas = filterFichas(MOCK_FICHAS, conVentana)
        .sort((a, b) => b.fechaConsulta.localeCompare(a.fechaConsulta))

    return {
        items: paginate(filtradas, page, pageSize),
        total: filtradas.length,
        page,
        pageSize,
    }
}

function imagenPlaceholder(texto: string): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480">
        <rect width="640" height="480" fill="#8AB3D6"/>
        <rect x="16" y="16" width="608" height="448" fill="none" stroke="#003E69" stroke-width="4"/>
        <text x="320" y="250" font-family="Montserrat, sans-serif" font-size="34"
              font-weight="600" fill="#003E69" text-anchor="middle">${texto}</text>
    </svg>`

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const FECHA_LARGA = new Intl.DateTimeFormat('es-GT', { dateStyle: 'long' })

function formatearFecha(iso: string): string {
    const [anio, mes, dia] = iso.split('-').map(Number)
    return FECHA_LARGA.format(new Date(anio, mes - 1, dia))
}

export async function getFichaByIdMock(fichaId: string): Promise<FichaDetalle> {
    await delay(LATENCIA_MS)

    const resumen = MOCK_FICHAS.find((ficha) => ficha.fichaId === fichaId)
    if (!resumen) {
        throw new ApiError(404, 'FICHA_NOT_FOUND', 'No se encontró la ficha solicitada', 'mock')
    }

    const variante = Number(resumen.fichaId.slice(-3)) % 3

    return {
        fichaId: resumen.fichaId,
        nombrePaciente: resumen.nombrePaciente,
        historiaClinica: resumen.historiaClinica,
        idTenant: resumen.idTenant,

        datosConsulta: {
            fechaConsulta: formatearFecha(resumen.fechaConsulta),
            medicoConsulta: 'Dr. Nicolás Castro',
            especialidad: 'Pediatra',
            diagnosticos: 'Síndrome de Down, malformación de ojos',
            referidoDe: { value: 'comadrona', label: 'Comadrona' },
            lugarDeParto: { value: 'hospital_local', label: 'Hospital local' },
            sexo: { value: '2', label: 'Femenino' },
        },

        otrosDemograficos: {
            familiaresAfectados: 1,
            menoresEnHogar: 2,
            adultosEnHogar: 3,
            quienAfectado: variante === 0 ? ['hermano', 'madre'] : ['hermana'],
            afectadosComunidad: variante === 2 ? 2 : 1,
        },

        signosAlerta: [
            {
                id: `${resumen.fichaId}-signo-1`,
                nombre: 'Dedo meñique torcido',
                parteDelCuerpo: {
                    regionValue: 'extremidades_superiores',
                    parteValue: 'mano',
                    lateralidad: 'izquierda',
                },
                parteDelCuerpoLabel: 'Mano (Izq.)',
                imagenUrl: imagenPlaceholder('Signo de alerta 1'),
            },
            {
                id: `${resumen.fichaId}-signo-2`,
                nombre: 'Paladar hendido',
                parteDelCuerpo: {
                    regionValue: 'cabeza_cuello',
                    parteValue: 'labio',
                },
                parteDelCuerpoLabel: 'Labio',
                imagenUrl: imagenPlaceholder('Signo de alerta 2'),
            },
        ],

        examenesSugeridos: [
            {
                id: `${resumen.fichaId}-examen-1`,
                nombre: 'Cariotipo (análisis cromosómico)',
                imagenUrl: imagenPlaceholder('Examen'),
                nombreArchivo: 'cariotipo.png',
            },
            {
                id: `${resumen.fichaId}-examen-2`,
                nombre: 'Ultrasonido renal',
            },
        ],

        observaciones: [
            {
                id: `${resumen.fichaId}-observacion-1`,
                texto:
                    'La madre refiere que un primo materno presentó rasgos similares al nacer.\n' +
                    'Se sugiere valorar interconsulta con genética en el próximo control.',
                fecha: resumen.fechaConsulta,
            },
        ],
    }
}

/** Historias de Storybook de una ficha registrada al solicitar una adenda. */

import { useEffect } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { RegistrationOrchestratorView } from '../../components/forms/RegistrationOrchestratorView/RegistrationOrchestratorView'
import type { AlertSignItem } from '../../components/forms/AlertSignsSection/AlertSignsSection'
import type { ExamItem } from '../../components/forms/ExamsSection/ExamsSection'
import hero from '../../assets/hero.png'

const BUCKET_SIMULADO = 'https://bucket.demo/objeto'

function ConUploadsSimulados({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const original = window.fetch
        window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
            if (url.includes('/uploads/presigned-url')) {
                return new Response(JSON.stringify({
                    success: true,
                    data: {
                        presignedUrl: BUCKET_SIMULADO,
                        documentId: 'documento-demo',
                        objectKey: `uploads/demo-${Date.now()}`,
                        headers: {},
                    },
                }), { status: 200, headers: { 'Content-Type': 'application/json' } })
            }
            if (url.startsWith(BUCKET_SIMULADO)) return new Response(null, { status: 200 })
            return original(input, init)
        }
        return () => { window.fetch = original }
    }, [])
    return <>{children}</>
}

const AVISO_FICHA_REGISTRADA =
    'Este paciente ya tiene una ficha asignada.'
const AVISO_ADENDA_DISPONIBLE =
    'Esta ficha admite adendas. Para agregar signos de alerta, estudios u observaciones, pulse «Solicitar adenda» al final.'
const AVISO_ADENDA_PENDIENTE =
    'Hay una adenda pendiente de aprobación. Podrá solicitar más cambios cuando se resuelva.'

const signosRegistrados: AlertSignItem[] = [
    { id: 'signo-1', title: 'Paladar hendido', imageSrc: hero, chips: ['Labio', 'Cabeza y cuello'], locked: true },
    { id: 'signo-2', title: 'Dedo meñique torcido', imageSrc: hero, chips: ['Dedos (Izq.)', 'Extremidades superiores'], locked: true },
    { id: 'signo-3', title: 'Pie equino varo', imageSrc: hero, chips: ['Pie (Der.)', 'Extremidades inferiores'], locked: true },
]

const examenesRegistrados: ExamItem[] = [
    { id: 'examen-1', title: 'Cariotipo (análisis cromosómico)', locked: true },
    { id: 'examen-2', title: 'Ecocardiograma', locked: true },
]

const fichaVigente = {
    patientName: 'Juan Alberto Pérez García',
    numeroExpediente: '00001234',
    fechaConsulta: '2026-06-21',
    medicoConsulta: 'Dra. Ana Lucía Morales',
    especialidad: 'Genética Clínica',
    diagnosticos: 'Paladar hendido',
    initialReferidoDe: '1',
    initialLugarDeParto: '2',
    initialFamiliaresAfectados: 1 as const,
    initialMenoresEnHogar: 1,
    initialAdultosEnHogar: 2,
    initialQuienAfectado: ['3'],
    initialAfectadosComunidad: 0 as const,
    initialAlertSigns: signosRegistrados,
    initialExams: examenesRegistrados,
    headerNotices: [{ text: AVISO_FICHA_REGISTRADA }],
    referidoDeOptions: [{ value: '1', label: 'Primer nivel de salud' }, { value: '2', label: 'Comadrona' }],
    lugarDePartoOptions: [{ value: '1', label: 'Comadrona' }, { value: '2', label: 'Hospital local' }],
    familiarAfectadoGroups: [{
        groupLabel: 'Núcleo familiar',
        options: [{ value: '1', label: 'Madre' }, { value: '2', label: 'Padre' }, { value: '3', label: 'Hermano(a)' }],
    }],
}

const meta: Meta<typeof RegistrationOrchestratorView> = {
    title: 'Flujos/Ficha con adendas',
    component: RegistrationOrchestratorView,
    parameters: {
        viewport: { defaultViewport: 'mobile1' },
        layout: 'fullscreen',
    },
    decorators: [(Story) => <ConUploadsSimulados><Story /></ConUploadsSimulados>],
}

export default meta
type Story = StoryObj<typeof RegistrationOrchestratorView>

export const FichaVigenteSoloLectura: Story = {
    args: { ...fichaVigente, mode: 'view', initialOpenSection: 'alerts' },
}

const adendaDisponible = {
    ...fichaVigente,
    mode: 'append' as const,
    initialOpenSection: 'appointment' as const,
    headerNotices: [{ text: AVISO_ADENDA_DISPONIBLE, tone: 'action' as const }],
    onRequestChanges: async (motivo: string) => {
        await new Promise((resolve) => setTimeout(resolve, 600))
        console.info('[story] Motivo de la adenda:', motivo)
    },
}

export const AdendaFlujoCompleto: Story = {
    args: adendaDisponible,
}

export const AdendaEnCaptura: Story = {
    args: { ...adendaDisponible, initialFaseAdenda: 'captura' },
}

export const AdendaPendienteDeAprobacion: Story = {
    args: {
        ...fichaVigente,
        mode: 'view',
        initialOpenSection: 'alerts',
        headerNotices: [{ text: AVISO_ADENDA_PENDIENTE, tone: 'pending' as const }],
    },
}

export const ConSustitucionYaAprobada: Story = {
    args: {
        ...fichaVigente,
        mode: 'view',
        initialOpenSection: 'alerts',
        initialAlertSigns: [
            { ...signosRegistrados[0], status: 'replaced' },
            ...signosRegistrados.slice(1),
            { id: 'signo-4', title: 'Paladar hendido (foto actualizada)', imageSrc: hero, chips: ['Labio', 'Cabeza y cuello'], locked: true },
        ],
    },
}

/** Historias de Storybook de la vista orquestadora que reúne todas las secciones de la ficha clínica. */

import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { RegistrationOrchestratorView } from './RegistrationOrchestratorView'

function imagenPlaceholder(texto: string): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480">
        <rect width="640" height="480" fill="#8AB3D6"/>
        <rect x="16" y="16" width="608" height="448" fill="none" stroke="#003E69" stroke-width="4"/>
        <text x="320" y="250" font-family="Montserrat, sans-serif" font-size="34"
              font-weight="600" fill="#003E69" text-anchor="middle">${texto}</text>
    </svg>`

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const meta: Meta<typeof RegistrationOrchestratorView> = {
    title: 'Forms/RegistrationOrchestratorView',
    component: RegistrationOrchestratorView,
    tags: ['autodocs'],
    parameters: {
        viewport: { defaultViewport: 'mobile1' },
    },
    args: {
        onBack: () => console.log('[storybook] regresar a la busqueda'),
    },
}

export default meta
type Story = StoryObj<typeof RegistrationOrchestratorView>

export const Empty: Story = {
    args: {
        patientName: 'Juan Alberto Perez Garcia',
        numeroExpediente: '12343546665555',
        fechaConsulta: '21 de Junio del 2023',
        medicoConsulta: 'Dr. Nicolas Castro',
        especialidad: 'Genetica Clinica',
        diagnosticos: 'Paladar hendido',
        initialOpenSection: 'appointment',
    },
}

export const FaltanCampos: Story = {
    ...Empty,
}

export const IntentoFinalizarIncompleto: Story = {
    ...Empty,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)

        const finalizar = canvas.getByRole('button', { name: 'Revisar ficha' })
        await expect(finalizar).toBeEnabled()

        await expect(canvas.getByText(/Falta completar/)).toBeInTheDocument()

        await userEvent.click(finalizar)

        await waitFor(() => expect(canvas.getAllByText('Este campo es requerido').length).toBeGreaterThan(0))
    },
}

export const AtajoDesdeElAviso: Story = {
    ...Empty,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        await userEvent.click(canvas.getByRole('button', { name: 'Ir a Consentimiento' }))
        await waitFor(() => expect(canvas.getByRole('button', { name: /Ir a Consentimiento/ })).toBeInTheDocument())
    },
}

export const Completed: Story = {
    args: {
        patientName: 'Juan Alberto Perez Garcia',
        numeroExpediente: '12343546665555',
        fechaConsulta: '21 de Junio del 2023',
        medicoConsulta: 'Dr. Nicolas Castro',
        especialidad: 'Genetica Clinica',
        diagnosticos: 'Paladar hendido',
        initialReferidoDe: 'igss',
        initialLugarDeParto: 'hospital',
        initialFamiliaresAfectados: 1,
        initialMenoresEnHogar: 1,
        initialAdultosEnHogar: 3,
        initialQuienAfectado: ['madre', 'padre'],
        initialAfectadosComunidad: 1,
        initialConsentValues: {
            'autorizacion-principal': true,
            'contacto-futuro': true,
            'aceptacion-final': true,
        },
        initialSignatureData: 'signed',
        initialSignerName: 'Maria Garcia Lopez',
        initialOpenSection: 'appointment',
    },
}

export const ReadOnly: Story = {
    args: {
        readOnly: true,
        patientName: 'Adolfo Alejandro Caal Tiul',
        numeroExpediente: '00445566777',
        fechaConsulta: '7 de julio de 2026',
        medicoConsulta: 'Dr. Nicolas Castro',
        especialidad: 'Genetica Clinica',
        diagnosticos: 'Sindrome de Down, malformacion de ojos',
        referidoDeOptions:   [{ value: 'comadrona',      label: 'Comadrona' }],
        lugarDePartoOptions: [{ value: 'hospital_local', label: 'Hospital local' }],
        initialReferidoDe:   'comadrona',
        initialLugarDeParto: 'hospital_local',
        initialFamiliaresAfectados: 1,
        initialMenoresEnHogar: 2,
        initialAdultosEnHogar: 3,
        initialQuienAfectado: ['hermana'],
        initialAfectadosComunidad: 2,
        initialAlertSigns: [
            {
                id: 'signo-1',
                title: 'Dedo menique torcido',
                imageSrc: imagenPlaceholder('Signo de alerta 1'),
                chips: ['Mano (Izq.)'],
                parteDelCuerpo: {
                    regionValue: 'extremidades_superiores',
                    parteValue: 'mano',
                    lateralidad: 'izquierda',
                },
            },
            {
                id: 'signo-2',
                title: 'Paladar hendido',
                imageSrc: imagenPlaceholder('Signo de alerta 2'),
                chips: ['Cara'],
                parteDelCuerpo: {
                    regionValue: 'cabeza',
                    parteValue: 'cara',
                },
            },
        ],
        initialExams: [
            {
                id: 'examen-1',
                title: 'Cariotipo (analisis cromosomico)',
                imageSrc: imagenPlaceholder('Cariotipo'),
            },
            {
                id: 'examen-2',
                title: 'Ultrasonido abdominal',
            },
        ],
    },
}

const fichaRegistrada = {
    patientName: 'Juan Alberto Perez Garcia',
    numeroExpediente: '12343546665555',
    fechaConsulta: '21 de Junio del 2023',
    medicoConsulta: 'Dr. Nicolas Castro',
    especialidad: 'Genetica Clinica',
    diagnosticos: 'Paladar hendido',
    initialReferidoDe: 'igss',
    initialLugarDeParto: 'hospital',
    initialFamiliaresAfectados: 1 as const,
    initialAfectadosComunidad: 0 as const,
    headerNotices: [{ text: 'Este paciente ya tiene una ficha asignada.' }],
    initialAlertSigns: [
        { id: 'signo-1', title: 'Dedo menique torcido', chips: ['Mano izq.'], locked: true },
        { id: 'signo-2', title: 'Foto sustituida', chips: ['Pie der.'], locked: true, status: 'replaced' as const },
    ],
    initialExams: [
        { id: 'exam-1', title: 'Cariotipo (analisis cromosomico)', locked: true },
    ],
}

export const FichaRegistrada: Story = {
    args: { ...fichaRegistrada, mode: 'view', initialOpenSection: 'alerts' },
}

export const FichaConAdendaPendiente: Story = {
    args: {
        ...fichaRegistrada,
        mode: 'view',
        initialOpenSection: 'alerts',
        headerNotices: [
            { text: 'Hay una adenda pendiente de aprobación. Podrá solicitar más cambios cuando se resuelva.', tone: 'pending' as const },
        ],
    },
}

export const Adenda: Story = {
    args: {
        ...fichaRegistrada,
        mode: 'append',
        initialOpenSection: 'alerts',
        headerNotices: [{
            text: 'Aquí puedes agregar una adenda: solo en Signos de Alerta y Estudios de Gabinete.',
            tone: 'action' as const,
        }],
        onRequestChanges: async () => {},
    },
}

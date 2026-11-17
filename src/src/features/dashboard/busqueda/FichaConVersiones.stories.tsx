/** Historias de Storybook del visor de una ficha con varias versiones. */

import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Undo2 } from 'lucide-react'
import { RegistrationOrchestratorView } from '../../../components/forms/RegistrationOrchestratorView/RegistrationOrchestratorView'
import type { AlertSignItem } from '../../../components/forms/AlertSignsSection/AlertSignsSection'
import type { ExamItem } from '../../../components/forms/ExamsSection/ExamsSection'
import type { FichaSummary } from '../../../services/ficha.service'
import { VersionSelector } from './VersionSelector'
import hero from '../../../assets/hero.png'
import layout from '../layout/DashboardLayout.module.css'
import styles from './FichaDetailPage.module.css'

const PACIENTE = 'Rachel Castro Morales'

function version(overrides: Partial<FichaSummary> & Pick<FichaSummary, 'fichaId'>): FichaSummary {
    return {
        fichaRaizId: 'raiz-demo',
        revision: 1,
        estado: 'COMPLETA',
        estadoFicha: 'COMPLETA',
        fechaConsulta: '2026-03-12',
        esVigente: false,
        medico: 'Dra. Ana Lucía Morales',
        ...overrides,
    }
}

const TRES_VERSIONES: FichaSummary[] = [
    version({ fichaId: 'v-1', revision: 1, fechaCreacion: '2026-03-12T15:04:00Z' }),
    version({ fichaId: 'v-2', revision: 2, fechaCreacion: '2026-06-03T09:20:00Z' }),
    version({ fichaId: 'v-3', revision: 3, esVigente: true, fechaCreacion: '2026-08-20T11:45:00Z' }),
]

const SIGNOS: Record<string, AlertSignItem> = {
    'v-1': { id: 'signo-1', title: 'Paladar hendido', imageSrc: hero, chips: ['Labio'], locked: true },
    'v-2': { id: 'signo-2', title: 'Dedo meñique torcido', imageSrc: hero, chips: ['Mano (Izq.)'], locked: true },
    'v-3': { id: 'signo-3', title: 'Pie equino varo', imageSrc: hero, chips: ['Pie (Der.)'], locked: true },
}

const EXAMENES: Record<string, ExamItem> = {
    'v-1': { id: 'examen-1', title: 'Cariotipo (análisis cromosómico)', locked: true },
    'v-2': { id: 'examen-2', title: 'Ecocardiograma', locked: true },
    'v-3': { id: 'examen-3', title: 'Ultrasonido renal', locked: true },
}

function contenidoDe(versiones: FichaSummary[], fichaId: string) {
    const hasta = versiones.findIndex((item) => item.fichaId === fichaId)
    const previas = versiones.slice(0, hasta + 1).map((item) => item.fichaId)

    return {
        signos: previas.map((id) => SIGNOS[id]).filter(Boolean),
        examenes: previas.map((id) => EXAMENES[id]).filter(Boolean),
    }
}

const FICHA = {
    patientName: PACIENTE,
    numeroExpediente: '00445566777',
    medicoConsulta: 'Dra. Ana Lucía Morales',
    especialidad: 'Genética Clínica',
    diagnosticos: 'Síndrome de Down, malformación de ojos',
    referidoDeOptions: [{ value: 'comadrona', label: 'Comadrona' }],
    lugarDePartoOptions: [{ value: 'hospital_local', label: 'Hospital local' }],
    initialReferidoDe: 'comadrona',
    initialLugarDeParto: 'hospital_local',
    initialFamiliaresAfectados: 1 as const,
    initialMenoresEnHogar: 2,
    initialAdultosEnHogar: 3,
    initialAfectadosComunidad: 1 as const,
}

interface VisorProps {
    versiones: FichaSummary[]
    inicial: string
    cargando?: boolean
}

function VisorDeFicha({ versiones, inicial, cargando = false }: VisorProps) {
    const [fichaActivaId, setFichaActivaId] = useState(inicial)
    const { signos, examenes } = contenidoDe(versiones, fichaActivaId)
    const activa = versiones.find((item) => item.fichaId === fichaActivaId)

    return (
        <div className={layout.shell}>
            <div className={layout.main}>
                <header className={layout.topbar}>
                    <h1 className={layout.title}>
                        Registro para el Paciente:{' '}
                        <span className={layout.titleHighlight}>{PACIENTE}</span>
                    </h1>
                    <div className={layout.action}>
                        <button
                            type="button"
                            className={styles.backButton}
                            aria-label="Regresar a la búsqueda"
                            title="Regresar a la búsqueda"
                        >
                            <Undo2 size={20} aria-hidden="true" />
                        </button>
                    </div>
                </header>

                <main className={layout.content}>
                    <div className={layout.contentInner}>
                        <VersionSelector
                            versiones={versiones}
                            fichaActivaId={fichaActivaId}
                            onSeleccionar={setFichaActivaId}
                            disabled={cargando}
                        />

                        {cargando ? (
                            <div
                                className={styles.sections}
                                aria-busy="true"
                                aria-label="Cargando la ficha"
                            >
                                {Array.from({ length: 4 }, (_, index) => (
                                    <div key={index} className={styles.skeleton} />
                                ))}
                            </div>
                        ) : (
                            <RegistrationOrchestratorView
                                key={fichaActivaId}
                                readOnly
                                {...FICHA}
                                fechaConsulta={activa?.fechaConsulta ?? ''}
                                initialAlertSigns={signos}
                                initialExams={examenes}
                            />
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}

const meta: Meta<typeof VisorDeFicha> = {
    title: 'Dashboard/Ficha con versiones',
    component: VisorDeFicha,
    parameters: { layout: 'fullscreen' },
    args: { versiones: TRES_VERSIONES, inicial: 'v-3' },
}

export default meta
type Story = StoryObj<typeof VisorDeFicha>

export const ConTresVersiones: Story = {}

export const EnUnaVersionAnterior: Story = {
    args: { inicial: 'v-1' },
}

export const ConRevisionPendiente: Story = {
    args: {
        versiones: [
            ...TRES_VERSIONES,
            version({ fichaId: 'v-4', revision: 4, estadoFicha: 'PENDIENTE' }),
        ],
    },
}

export const SinFechasDelServidor: Story = {
    args: {
        versiones: TRES_VERSIONES.map((item) => ({ ...item, fechaCreacion: undefined })),
    },
}

export const FichaSinAdendas: Story = {
    args: { versiones: [TRES_VERSIONES[0]], inicial: 'v-1' },
}

export const CambiandoDeVersion: Story = {
    args: { inicial: 'v-2', cargando: true },
}

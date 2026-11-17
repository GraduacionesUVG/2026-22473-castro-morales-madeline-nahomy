/** Historias de Storybook de la tarjeta de resultado de la búsqueda de fichas. */

import type { Meta, StoryObj } from '@storybook/react-vite'
import { FichaResultCard } from './FichaResultCard'

const meta: Meta<typeof FichaResultCard> = {
    title: 'UI/FichaResultCard',
    component: FichaResultCard,
    tags: ['autodocs'],
    args: {
        onVerRegistro: () => {},
    },
    decorators: [
        (Story) => (
            <div style={{ maxWidth: 280 }}>
                <Story />
            </div>
        ),
    ],
}

export default meta
type Story = StoryObj<typeof FichaResultCard>

export const Default: Story = {
    args: {
        ficha: {
            fichaId: 'f-001',
            nombrePaciente: 'Rachel Castro',
            fechaConsulta: '2026-07-07',
            historiaClinica: '00445566777',
            idTenant: 23,
        },
    },
}

export const NombreLargo: Story = {
    args: {
        ficha: {
            fichaId: 'f-002',
            nombrePaciente: 'María José Alejandra Xoc Chávez de la Cruz',
            fechaConsulta: '2026-06-28',
            historiaClinica: '00445566778',
            idTenant: 41,
        },
    },
}

export const EnRejilla: Story = {
    decorators: [
        (Story) => (
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: 16,
                    maxWidth: 1080,
                }}
            >
                <Story />
                <FichaResultCard
                    ficha={{
                        fichaId: 'f-003',
                        nombrePaciente: 'María José Alejandra Xoc Chávez',
                        fechaConsulta: '2026-06-28',
                        historiaClinica: '00445566779',
                        idTenant: 41,
                    }}
                    onVerRegistro={() => {}}
                />
                <FichaResultCard
                    ficha={{
                        fichaId: 'f-004',
                        nombrePaciente: 'Diego Ruiz',
                        fechaConsulta: '2026-06-15',
                        historiaClinica: '00445566780',
                        idTenant: 17,
                    }}
                    onVerRegistro={() => {}}
                />
            </div>
        ),
    ],
    args: {
        ficha: {
            fichaId: 'f-001',
            nombrePaciente: 'Rachel Castro',
            fechaConsulta: '2026-07-07',
            historiaClinica: '00445566777',
            idTenant: 23,
        },
    },
}

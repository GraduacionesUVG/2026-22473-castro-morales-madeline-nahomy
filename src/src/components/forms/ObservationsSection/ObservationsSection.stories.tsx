/** Historias de Storybook de la sección Observaciones de la ficha clínica. */

import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ObservationsSection, type ObservacionItem } from './ObservationsSection'

const meta: Meta<typeof ObservationsSection> = {
    title: 'forms/ObservationsSection',
    component: ObservationsSection,
    tags: ['autodocs'],
    parameters: {
        viewport: { defaultViewport: 'mobile1' },
    },
}

export default meta
type Story = StoryObj<typeof ObservationsSection>

const registradas: ObservacionItem[] = [
    {
        id: 'obs-1',
        text:
            'La madre refiere que un primo materno presentó rasgos similares al nacer.\n' +
            'Se sugiere valorar interconsulta con genética en el próximo control.',
        fecha: '10 sep 2026',
        locked: true,
    },
]

function Interactiva({ iniciales = [], ...props }: { iniciales?: ObservacionItem[] } & Partial<Parameters<typeof ObservationsSection>[0]>) {
    const [items, setItems] = useState<ObservacionItem[]>(iniciales)

    return (
        <ObservationsSection
            {...props}
            items={items}
            onAdd={(item) => setItems((prev) => [...prev, item])}
            onRemove={(id) => setItems((prev) => prev.filter((item) => item.id !== id))}
        />
    )
}

export const Default: Story = {
    render: () => <Interactiva />,
}

export const SinFirma: Story = {
    render: () => <Interactiva disabled />,
}

export const SoloLectura: Story = {
    render: () => <Interactiva iniciales={registradas} readOnly />,
}

export const SoloLecturaVacia: Story = {
    render: () => <Interactiva readOnly />,
}

export const Adenda: Story = {
    render: () => <Interactiva iniciales={registradas} />,
}

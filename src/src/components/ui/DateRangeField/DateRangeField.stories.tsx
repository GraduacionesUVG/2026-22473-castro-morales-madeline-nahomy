/** Historias de Storybook de el campo de rango de fechas. */

import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { DateRangeField } from './DateRangeField'
import { isInvalidRange, type DateRange } from './dateRange'

const meta: Meta<typeof DateRangeField> = {
    title: 'UI/DateRangeField',
    component: DateRangeField,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div style={{ maxWidth: 360 }}>
                <Story />
            </div>
        ),
    ],
}

export default meta
type Story = StoryObj<typeof DateRangeField>

export const Vacio: Story = {
    args: {
        value: { desde: '', hasta: '' },
        onChange: () => {},
    },
}

export const ConRango: Story = {
    args: {
        value: { desde: '2026-01-01', hasta: '2026-07-07' },
        onChange: () => {},
    },
}

export const ConEtiqueta: Story = {
    args: {
        label: 'Fecha de consulta',
        value: { desde: '2026-01-01', hasta: '' },
        onChange: () => {},
    },
}

export const ConError: Story = {
    args: {
        value: { desde: '2026-08-01', hasta: '2026-01-01' },
        error: 'La fecha inicial no puede ser posterior a la final.',
        onChange: () => {},
    },
}

export const Deshabilitado: Story = {
    args: {
        value: { desde: '2026-01-01', hasta: '2026-07-07' },
        disabled: true,
        onChange: () => {},
    },
}

export const Interactivo: Story = {
    render: () => {
        const [value, setValue] = useState<DateRange>({ desde: '', hasta: '' })

        return (
            <DateRangeField
                label="Fecha de consulta"
                value={value}
                onChange={setValue}
                error={isInvalidRange(value) ? 'La fecha inicial no puede ser posterior a la final.' : undefined}
            />
        )
    },
}

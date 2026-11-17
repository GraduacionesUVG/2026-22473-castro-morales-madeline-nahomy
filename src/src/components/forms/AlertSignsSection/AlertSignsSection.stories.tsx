/** Historias de Storybook de la sección Signos de Alerta de la ficha clínica. */

import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { AlertSignsSection, type AlertSignItem } from './AlertSignsSection'
import hero from '../../../assets/react.svg'

const meta: Meta<typeof AlertSignsSection> = {
    title: 'forms/AlertSignsSection',
    component: AlertSignsSection,
    tags: ['autodocs'],
    parameters: {
        viewport: { defaultViewport: 'mobile1' },
    },
}

export default meta
type Story = StoryObj<typeof AlertSignsSection>

const initialItems: AlertSignItem[] = [
    {
        id: 'signo-1',
        title: 'Dedo menique torcido',
        imageSrc: hero,
        chips: ['Mano izq.'],
    },
    {
        id: 'signo-2',
        title: 'Paladar Hendido',
        imageSrc: hero,
        chips: ['Cara'],
    },
]

export const Default: Story = {
    render: () => {
        const [items, setItems] = useState(initialItems)

        const handleRemove = (id: string) => {
            setItems((prev) => prev.filter((item) => item.id !== id))
        }

        return (
            <AlertSignsSection
                title="Signos de Alerta"
                items={items}
                onRemove={handleRemove}
            />
        )
    },
}

const storedItems: AlertSignItem[] = [
    { id: 'signo-1', title: 'Dedo menique torcido', imageSrc: hero, chips: ['Mano izq.'], locked: true },
    { id: 'signo-2', title: 'Paladar Hendido', imageSrc: hero, chips: ['Cara'], locked: true },
    { id: 'signo-3', title: 'Foto sustituida', imageSrc: hero, chips: ['Pie der.'], locked: true, status: 'replaced' },
]

export const FichaRegistrada: Story = {
    args: { items: storedItems, readOnly: true },
}

export const Adenda: Story = {
    render: () => {
        const [items, setItems] = useState<AlertSignItem[]>(storedItems)
        return (
            <AlertSignsSection
                items={items}
                allowReplacement
                onAdd={(item) => setItems((prev) => [...prev, item])}
                onRemove={(id) => setItems((prev) => prev.filter((item) => item.locked || item.id !== id))}
            />
        )
    },
}

export const AvisoAlFotografiarUnMenor: Story = {
    ...Default,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        await userEvent.click(canvas.getByRole('button', { name: /Agregar signo de alerta/ }))

        await userEvent.click(canvas.getByRole('button', { name: 'Cabeza y cuello' }))
        await userEvent.click(canvas.getByRole('button', { name: 'Cráneo' }))
        await userEvent.click(canvas.getByRole('button', { name: /Siguiente/ }))

        await expect(canvas.getByText('Tome una foto del hallazgo clínico')).toBeInTheDocument()
        await expect(canvas.getByText(/Imagen clínica de un menor/)).toBeInTheDocument()
    },
}

export const AdendaPreguntaPorSustitucion: Story = {
    ...Adenda,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement)
        await userEvent.click(canvas.getByRole('button', { name: /Agregar signo de alerta/ }))
        await expect(canvas.getByText('Paso 1 de 4')).toBeInTheDocument()
    },
}

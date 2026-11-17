/** Historias de Storybook de el marcador de contenido pendiente. */

import type { Meta, StoryObj } from '@storybook/react-vite'
import { PagePlaceholder } from './PagePlaceholder'

const meta: Meta<typeof PagePlaceholder> = {
    title: 'UI/PagePlaceholder',
    component: PagePlaceholder,
    tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof PagePlaceholder>

export const SoloDescripcion: Story = {
    args: {
        description: 'Reportes y exportaciones sobre las fichas registradas.',
    },
}

export const ConTitulo: Story = {
    args: {
        title: 'Búsqueda',
        description: 'Consulta de pacientes y fichas ya registradas.',
    },
}

export const NotaPropia: Story = {
    args: {
        description: 'Revisión y corrección de los códigos CIE-10 asignados a las fichas.',
        note: 'Aquí iría la tabla de códigos pendientes de revisar',
    },
}

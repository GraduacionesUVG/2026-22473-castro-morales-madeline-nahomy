/** Historias de Storybook de la pantalla de acceso denegado al dashboard. */

import type { Meta, StoryObj } from '@storybook/react-vite'
import { AccessDeniedView } from './AccessDeniedView'

const meta: Meta<typeof AccessDeniedView> = {
    title: 'Auth/AccessDeniedView',
    component: AccessDeniedView,
    tags: ['autodocs'],
    parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof AccessDeniedView>

export const SinRol: Story = {
    args: {
        displayName: 'Dr. Marco Paez',
        onLogout: () => undefined,
    },
}

export const SinNombre: Story = {
    args: {
        onLogout: () => undefined,
    },
}

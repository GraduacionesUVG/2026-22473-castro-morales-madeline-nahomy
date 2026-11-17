/** Historias de Storybook de la barra superior de la aplicación. */

import type { Meta, StoryObj } from '@storybook/react-vite'
import { AppTopBar } from './AppTopBar'

const meta: Meta<typeof AppTopBar> = {
    title: 'UI/AppTopBar',
    component: AppTopBar,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
    },
    decorators: [
        (Story) => (
            <div style={{ background: 'var(--color-primary)', minHeight: '160px' }}>
                <Story />
            </div>
        ),
    ],
}

export default meta
type Story = StoryObj<typeof AppTopBar>

export const Default: Story = {
    args: {
        userName: 'Dra. Pérez',
        onLogout: () => console.log('logout'),
    },
}

export const NombreLargo: Story = {
    args: {
        ...Default.args,
        userName: 'Dra. María Fernanda Castro Morales de la Vega',
    },
}

export const ConDashboard: Story = {
    args: {
        ...Default.args,
        onGoToDashboard: () => console.log('dashboard'),
    },
}

export const SinSesion: Story = {
    args: {},
}

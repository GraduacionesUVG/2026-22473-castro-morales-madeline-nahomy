/** Historias de Storybook de la pantalla de registro manual de un paciente no encontrado en SADC. */

import type { Meta, StoryObj } from '@storybook/react-vite'
import { ManualRegistrationView } from './ManualRegistrationView'

const meta: Meta<typeof ManualRegistrationView> = {
    title: 'Forms/ManualRegistrationView',
    component: ManualRegistrationView,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
    },
}

export default meta
type Story = StoryObj<typeof ManualRegistrationView>

export const Default: Story = {
    args: {
        historiaClinica: '12345678',
        tenantId: '23',
        tenantLabel: '23 - PruebaInstitucion',
        onSubmit: (values) => console.log('abrir ficha', values),
        onBack: () => console.log('volver'),
        authenticatedUser: 'Dra. Pérez',
        onLogout: () => console.log('logout'),
    },
}

export const ConError: Story = {
    args: {
        ...Default.args,
        errorMessage: 'No se pudo verificar la historia clínica en SADC. Intente de nuevo en unos minutos.',
    },
}

/** Historias de Storybook de la pantalla de búsqueda de pacientes. */

import type { Meta, StoryObj } from '@storybook/react-vite'
import { PatientSearchView } from './PatientSearchView'

const meta: Meta<typeof PatientSearchView> = {
    title: 'Forms/PatientSearchView',
    component: PatientSearchView,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
    },
}

export default meta
type Story = StoryObj<typeof PatientSearchView>

export const Default: Story = {
    args: {
        tenantOptions: [
            { id: '23', name: 'PruebaInstitucion', label: '23 - PruebaInstitucion' },
            { id: '254', name: 'SADC', label: '254 - SADC' },
        ],
        tenantId: '23',
        onTenantIdChange: () => {},
        onSearch: (historiaClinica, idTenant) =>
            console.log('buscar', historiaClinica, idTenant),
        authenticatedUser: 'Dra. Pérez',
        onLogout: () => console.log('logout'),
    },
}

export const NoEncontrado: Story = {
    args: {
        ...Default.args,
        initialHistoriaClinica: '12345678',
        notFound: { historiaClinica: '12345678', tenantId: '23' },
        onManualRegister: () => console.log('registrar manualmente'),
        onNotFoundDismiss: () => console.log('descartar aviso'),
    },
}

export const Cargando: Story = {
    args: {
        ...Default.args,
        isLoading: true,
        initialHistoriaClinica: '12345678',
        tenantId: '23',
    },
}

export const ConValoresPrevios: Story = {
    args: {
        ...Default.args,
        initialHistoriaClinica: '12345678',
        tenantId: '23',
    },
}

export const SinSesion: Story = {
    args: {
        ...Default.args,
        authenticatedUser: undefined,
        onLogout: undefined,
    },
}

export const NombreLargo: Story = {
    args: {
        ...Default.args,
        authenticatedUser: 'Dra. María Fernanda Castro Morales de la Vega',
    },
    parameters: {
        viewport: { defaultViewport: 'mobile1' },
    },
}

export const SinInstituciones: Story = {
    args: {
        ...Default.args,
        tenantOptions: [],
        tenantId: '',
    },
}

/** Historias de Storybook de el armazón del dashboard. */

import type { Meta, StoryObj } from '@storybook/react-vite'
import type { User } from 'oidc-client-ts'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { DashboardLayout } from './DashboardLayout'
import { AuthContext, type AuthContextValue } from '../../auth/AuthContext'
import type { Access } from '../../auth/permissions'
import { InicioPage } from '../pages/InicioPage'
import { BusquedaPage } from '../busqueda/BusquedaPage'
import { ReporteriaPage } from '../reporteria/ReporteriaPage'
import { CorreccionCie10Page } from '../cie10/CorreccionCie10Page'
import { Cie10LotePage } from '../cie10/Cie10LotePage'
import { reportingMock } from '../../../services/reporting.mock'

const medico = {
    profile: {
        name: 'Dr. Marco Paez',
        especialidad: 'Genetista',
    },
} as unknown as User

const access: Access = { permissions: new Set(['dashboard', 'fichas.crear', 'adendas.revisar', 'reporteria', 'cie10.corregir']), roleLabel: 'Genetista', tenants: [] }

const auth: AuthContextValue = {
    state: { status: 'authenticated', user: medico, access },
    signIn: () => undefined,
    logout: () => undefined,
    returnPath: null,
    consumeReturnPath: () => undefined,
}

function DashboardLayoutDemo({ path }: { path: string }) {
    return (
        <AuthContext.Provider value={auth}>
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route path="/dashboard" element={<DashboardLayout />}>
                        <Route index element={<InicioPage />} />
                        <Route path="busqueda" element={<BusquedaPage />} />
                        <Route path="reporteria" element={<ReporteriaPage servicio={reportingMock} />} />
                        <Route path="cie10" element={<CorreccionCie10Page />} />
                        <Route path="cie10/:runId" element={<Cie10LotePage />} />
                    </Route>
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>
    )
}

const meta: Meta<typeof DashboardLayout> = {
    title: 'Dashboard/DashboardLayout',
    component: DashboardLayout,
    parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof DashboardLayout>

export const Inicio: Story = {
    render: () => <DashboardLayoutDemo path="/dashboard" />,
}

export const SeccionReporteria: Story = {
    render: () => <DashboardLayoutDemo path="/dashboard/reporteria" />,
}

export const SeccionCie10: Story = {
    render: () => <DashboardLayoutDemo path="/dashboard/cie10" />,
}

export const SeccionCie10Lote: Story = {
    render: () => <DashboardLayoutDemo path="/dashboard/cie10/run-2026-10-17" />,
}

export const Movil: Story = {
    parameters: { viewport: { defaultViewport: 'mobile1' } },
    render: () => <DashboardLayoutDemo path="/dashboard/busqueda" />,
}

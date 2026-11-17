/** Historias de Storybook del flujo completo de reportería con el agente. */

import type { Meta, StoryObj } from '@storybook/react-vite'
import type { User } from 'oidc-client-ts'
import { Toaster } from 'react-hot-toast'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { TOASTER_PROPS } from '../../../config/toast'
import { AuthContext, type AuthContextValue } from '../../auth/AuthContext'
import type { Access } from '../../auth/permissions'
import { DashboardLayout } from '../layout/DashboardLayout'
import { InicioPage } from '../pages/InicioPage'
import { reportingMock } from '../../../services/reporting.mock'
import type { ReportingService } from '../../../services/reporting.service'
import { ReporteriaPage } from './ReporteriaPage'

const medico = {
    profile: {
        name: 'Dr. Marco Paez',
        especialidad: 'Genetista',
    },
} as unknown as User

const access: Access = { permissions: new Set(['dashboard', 'fichas.crear', 'adendas.revisar', 'reporteria']), roleLabel: 'Genetista', tenants: [] }

const auth: AuthContextValue = {
    state: { status: 'authenticated', user: medico, access },
    signIn: () => undefined,
    logout: () => undefined,
    returnPath: null,
    consumeReturnPath: () => undefined,
}

const servicioColgado: ReportingService = {
    ...reportingMock,
    obtenerResumenReporteria: () => new Promise(() => {}),
    obtenerTopDiagnosticos: () => new Promise(() => {}),
    obtenerSerieMensualSigsa: () => new Promise(() => {}),
    obtenerSerieMensualCongenia: () => new Promise(() => {}),
}

const servicioConFallas: ReportingService = {
    ...reportingMock,
    obtenerSerieMensualSigsa: () => Promise.reject(new Error('sin conexión')),
    obtenerSerieMensualCongenia: () => Promise.reject(new Error('sin conexión')),
    consultarAgente: () => new Promise((_, reject) => setTimeout(() => reject(new Error('sin conexión')), 600)),
}

function FlujoReporteria({ servicio }: { servicio: ReportingService }) {
    return (
        <AuthContext.Provider value={auth}>
            <MemoryRouter initialEntries={['/dashboard/reporteria']}>
                <Routes>
                    <Route path="/dashboard" element={<DashboardLayout />}>
                        <Route index element={<InicioPage />} />
                        <Route path="reporteria" element={<ReporteriaPage servicio={servicio} />} />
                    </Route>
                </Routes>
            </MemoryRouter>
            <Toaster {...TOASTER_PROPS} />
        </AuthContext.Provider>
    )
}

const meta: Meta<typeof FlujoReporteria> = {
    title: 'Flujos/Reportería',
    component: FlujoReporteria,
    parameters: { layout: 'fullscreen' },
    args: { servicio: reportingMock },
    argTypes: { servicio: { table: { disable: true } } },
}

export default meta
type Story = StoryObj<typeof FlujoReporteria>

export const Completo: Story = {}

export const Movil: Story = {
    globals: { viewport: { value: 'mobile1' } },
}

export const Cargando: Story = {
    args: { servicio: servicioColgado },
}

export const ConFallas: Story = {
    args: { servicio: servicioConFallas },
}

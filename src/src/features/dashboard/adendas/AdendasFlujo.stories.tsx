/** Historias de Storybook del flujo completo de corrección de adendas. */

import type { Meta, StoryObj } from '@storybook/react-vite'
import type { User } from 'oidc-client-ts'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext, type AuthContextValue } from '../../auth/AuthContext'
import type { Access } from '../../auth/permissions'
import { DashboardLayout } from '../layout/DashboardLayout'
import { AdendasPage } from './AdendasPage'
import { AdendaReviewPage } from './AdendaReviewPage'

const revisora = {
    profile: {
        name: 'Dra. Ana Gómez',
        especialidad: 'Genetista',
    },
} as unknown as User

const access: Access = { permissions: new Set(['dashboard', 'fichas.crear', 'adendas.revisar', 'reporteria']), roleLabel: 'Genetista', tenants: [] }

const auth: AuthContextValue = {
    state: { status: 'authenticated', user: revisora, access },
    signIn: () => undefined,
    logout: () => undefined,
    returnPath: null,
    consumeReturnPath: () => undefined,
}

function FlujoAdendas({ path }: { path: string }) {
    return (
        <AuthContext.Provider value={auth}>
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route path="/dashboard" element={<DashboardLayout />}>
                        <Route path="adendas" element={<AdendasPage />} />
                        <Route path="adendas/:fichaId" element={<AdendaReviewPage />} />
                    </Route>
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>
    )
}

const meta: Meta<typeof FlujoAdendas> = {
    title: 'Flujos/Corrección de adendas',
    component: FlujoAdendas,
    parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof FlujoAdendas>

export const Bandeja: Story = {
    args: { path: '/dashboard/adendas' },
}

export const RevisionConVariosCambios: Story = {
    args: { path: '/dashboard/adendas/ad-001' },
}

export const RevisionDeUnSoloCambio: Story = {
    args: { path: '/dashboard/adendas/ad-002' },
}

export const AltaSinSustitucion: Story = {
    args: { path: '/dashboard/adendas/ad-003' },
}

export const AdendaYaAprobada: Story = {
    args: { path: '/dashboard/adendas/ad-004' },
}

export const AdendaRechazada: Story = {
    args: { path: '/dashboard/adendas/ad-006' },
}

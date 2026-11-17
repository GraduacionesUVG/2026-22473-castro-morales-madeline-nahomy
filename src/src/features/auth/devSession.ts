/** Sesión de desarrollo para trabajar sin Keycloak ni SADC. */

import type { User } from 'oidc-client-ts'
import type { SessionActivateResponse } from '../../services/session.service'
import type { Access } from './permissions'
import { ALLOW_DEV_SESSION as ALLOW_DEV_SESSION_FLAG, APP_ENV } from '../../config/runtime'

export const ALLOW_DEV_SESSION = ['1', 'true', 'yes', 'on']
    .includes(ALLOW_DEV_SESSION_FLAG.trim().toLowerCase())
    || APP_ENV.trim().toLowerCase() === 'test'

export const DEV_USER = {
    profile: {
        name: 'Dr. Marco Paez',
        especialidad: 'Genetista',
    },
} as unknown as User

export const DEV_ACCESS: Access = {
    permissions: new Set(['dashboard', 'fichas.crear', 'adendas.revisar', 'cie10.corregir', 'reporteria']),
    roleLabel: 'Superadministrador',
    tenants: [],
}

export const DEV_FICHA_SESSION: SessionActivateResponse = {
    fichaId:        '00000000-0000-4000-8000-000000000001',
    sessionId:      '00000000-0000-4000-8000-000000000002',
    origenCreacion: 'INTEGRACION',
    alreadyActive:  false,
    paciente: {
        patientId:       'dev-patient-001',
        externalId:      'EXP-DEV-001',
        nombre:          'Juan Alberto Perez Garcia',
    },
    consulta: {
        fechaConsulta:    '2023-06-21',
        diagnosticoTexto: 'Paladar hendido',
    },
    medico: {
        medicoId:    '00000000-0000-4000-8000-000000000003',
        medicoExtId: 'dev-medico-001',
        nombre:      'Dr. Nicolas Castro',
        especialidad: 'Genética Clínica',
    },
}

/** Contexto de React con la sesión y los permisos del usuario. */

import { createContext } from 'react'
import type { User } from 'oidc-client-ts'
import type { Access } from './permissions'

export type AuthState =
    | { status: 'loading' }
    | { status: 'anonymous' }
    | { status: 'authenticated'; user: User; access: Access }
    | { status: 'error'; message: string }

export interface AuthContextValue {
    state: AuthState
    signIn: () => void
    logout: () => void
    returnPath: string | null
    consumeReturnPath: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

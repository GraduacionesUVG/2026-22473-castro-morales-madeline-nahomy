/** Datos presentables del médico autenticado. */

import type { User } from 'oidc-client-ts'

export function displayNameOf(user: User | null | undefined): string {
    if (!user) return ''
    return String(user.profile.name ?? user.profile.preferred_username ?? '')
}

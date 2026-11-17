/** Consulta del perfil del usuario (GET /me) con caché por token. */

import type { User } from 'oidc-client-ts'
import { getMe, type MeProfile } from '../../services/ficha.service'

let cached: { token: string; profile: Promise<MeProfile> } | null = null

export function loadMe(user: User): Promise<MeProfile> {
    if (cached?.token === user.access_token) return cached.profile

    const profile = getMe()
    const entry = { token: user.access_token, profile }
    cached = entry
    profile.catch(() => {
        if (cached === entry) cached = null
    })
    return profile
}

export function resetMeCache(): void {
    cached = null
}

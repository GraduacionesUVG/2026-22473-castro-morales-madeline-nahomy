/** Autenticación OIDC con Authorization Code + PKCE contra Keycloak. */

import { UserManager, WebStorageStateStore, type User } from 'oidc-client-ts'
import { OIDC_AUTHORITY, OIDC_CLIENT_ID } from '../config/runtime'
import { cleanOidcCallbackUrl, oidcErrorMessage, readOidcCallback } from './oidc-callback'

const callbackUri = `${window.location.origin}/`

const userManager = new UserManager({
    authority: OIDC_AUTHORITY.replace(/\/+$/, ''),
    client_id: OIDC_CLIENT_ID,
    redirect_uri: callbackUri,
    post_logout_redirect_uri: callbackUri,
    response_type: 'code',
    scope: 'openid profile email',
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),
    stateStore: new WebStorageStateStore({ store: window.sessionStorage }),
    monitorSession: false,
    automaticSilentRenew: true,
})

let initialization: Promise<User> | null = null
let loginRedirect: Promise<void> | null = null

function redirectToLogin(): Promise<never> {
    loginRedirect ??= userManager.signinRedirect({ state: currentReturnPath() })
    return loginRedirect.then(() => new Promise<never>(() => undefined))
}

function currentReturnPath(): string {
    return `${window.location.pathname}${window.location.search}`
}

async function discardOidcState(state: string | null): Promise<void> {
    if (state) window.sessionStorage.removeItem(`oidc.${state}`)

    await Promise.allSettled([
        userManager.removeUser(),
        userManager.clearStaleState(),
    ])

    window.history.replaceState(
        window.history.state,
        '',
        cleanOidcCallbackUrl(window.location.href),
    )
}

async function rejectOidcCallback(code: string, state: string | null): Promise<never> {
    if (state) {
        try {
            await userManager.signinRedirectCallback()
        } catch {}
    }

    await discardOidcState(state)
    throw new Error(oidcErrorMessage(code))
}

export function requireAuthenticatedUser(): Promise<User> {
    if (initialization) return initialization

    initialization = (async () => {
        const callback = readOidcCallback(window.location)
        if (callback.kind === 'error') {
            return rejectOidcCallback(callback.code, callback.state)
        }

        if (callback.kind === 'success') {
            try {
                const callbackUser = await userManager.signinRedirectCallback()
                window.history.replaceState(
                    window.history.state,
                    '',
                    cleanOidcCallbackUrl(window.location.href),
                )
                return callbackUser
            } catch {
                await discardOidcState(callback.state)
                throw new Error('No se pudo validar la respuesta de inicio de sesión de Keycloak.')
            }
        }

        const existing = await userManager.getUser()
        if (existing && !existing.expired) return existing

        return redirectToLogin()
    })().catch((error) => {
        initialization = null
        throw error
    })

    return initialization
}

export async function getExistingUser(): Promise<User | null> {
    try {
        const user = await userManager.getUser()
        return user && !user.expired ? user : null
    } catch {
        return null
    }
}

export function onUserLoaded(listener: (user: User) => void): () => void {
    userManager.events.addUserLoaded(listener)
    return () => userManager.events.removeUserLoaded(listener)
}

const RELOGIN_KEY = 'congenia.auth.reloginAt'
const RELOGIN_COOLDOWN_MS = 60_000

export function handleUnauthorized(): void {
    try {
        const last = Number(window.sessionStorage.getItem(RELOGIN_KEY) ?? 0)
        if (Date.now() - last < RELOGIN_COOLDOWN_MS) return
        window.sessionStorage.setItem(RELOGIN_KEY, String(Date.now()))
    } catch {}

    initialization = null
    void userManager.removeUser()
        .catch(() => undefined)
        .then(() => redirectToLogin())
}

const REFRESH_COOLDOWN_MS = 30_000
let lastRefresh = 0

export async function refreshSession(): Promise<void> {
    if (Date.now() - lastRefresh < REFRESH_COOLDOWN_MS) return
    lastRefresh = Date.now()

    try {
        await userManager.signinSilent()
    } catch {}
}

export function logout(): Promise<void> {
    initialization = null
    loginRedirect = null
    return userManager.signoutRedirect()
}

export async function getValidAccessToken(): Promise<string> {
    if (initialization || readOidcCallback(window.location).kind !== 'none') {
        await requireAuthenticatedUser()
    }

    const user = await userManager.getUser()
    if (user && !user.expired && (user.expires_in ?? 0) > 30) {
        return user.access_token
    }

    if (user?.refresh_token) {
        try {
            const renewed = await userManager.signinSilent()
            if (renewed) return renewed.access_token
        } catch {
            await userManager.removeUser()
        }
    }

    initialization = null
    return redirectToLogin()
}

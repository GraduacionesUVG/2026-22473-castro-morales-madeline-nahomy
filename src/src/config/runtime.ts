/** Configuración de la aplicación resuelta al arrancar desde config.js o las variables VITE_*. */

export interface RuntimeConfig {
    API_BASE_URL: string
    OIDC_AUTHORITY: string
    OIDC_CLIENT_ID: string
    APP_ENV: string
    USE_FICHA_SEARCH_MOCK: string
    USE_ADENDAS_MOCK: string
    USE_CIE10_MOCK: string
    ALLOW_DEV_SESSION: string
}

declare global {
    interface Window {
        __CONGENIA_CONFIG__?: Partial<RuntimeConfig>
    }
}

function readRuntimeValue(key: keyof RuntimeConfig): string | undefined {
    if (typeof window === 'undefined') return undefined

    const value = window.__CONGENIA_CONFIG__?.[key]
    if (typeof value !== 'string') return undefined

    const trimmed = value.trim()
    if (trimmed === '' || trimmed.startsWith('${')) return undefined

    return trimmed
}

function resolveApiBaseUrl(): string {
    const runtime = readRuntimeValue('API_BASE_URL')
    if (runtime !== undefined) return runtime.replace(/\/+$/, '')

    const build = import.meta.env.VITE_API_BASE_URL
    if (typeof build === 'string' && build.trim() !== '') return build.trim().replace(/\/+$/, '')

    return ''
}

export const API_BASE_URL: string = resolveApiBaseUrl()

function currentOrigin(): string {
    return typeof window === 'undefined' ? '' : window.location.origin
}

const buildOidcAuthority = import.meta.env.VITE_OIDC_AUTHORITY
export const OIDC_AUTHORITY: string = readRuntimeValue('OIDC_AUTHORITY') ?? (
    typeof buildOidcAuthority === 'string' && buildOidcAuthority.trim()
        ? buildOidcAuthority.trim()
        : `${currentOrigin()}/realms/congenia`
)

const buildOidcClientId = import.meta.env.VITE_OIDC_CLIENT_ID
export const OIDC_CLIENT_ID: string = readRuntimeValue('OIDC_CLIENT_ID') ?? (
    typeof buildOidcClientId === 'string' && buildOidcClientId.trim()
        ? buildOidcClientId.trim()
        : 'congenia-web'
)

export const APP_ENV: string =
    readRuntimeValue('APP_ENV') ?? import.meta.env.VITE_APP_ENV ?? 'development'

export const USE_FICHA_SEARCH_MOCK: string =
    readRuntimeValue('USE_FICHA_SEARCH_MOCK') ?? import.meta.env.VITE_USE_FICHA_SEARCH_MOCK ?? ''

export const USE_ADENDAS_MOCK: string =
    readRuntimeValue('USE_ADENDAS_MOCK') ?? import.meta.env.VITE_USE_ADENDAS_MOCK ?? ''

export const USE_CIE10_MOCK: string =
    readRuntimeValue('USE_CIE10_MOCK') ?? import.meta.env.VITE_USE_CIE10_MOCK ?? ''

export const ALLOW_DEV_SESSION: string =
    readRuntimeValue('ALLOW_DEV_SESSION') ?? import.meta.env.VITE_ALLOW_DEV_SESSION ?? ''

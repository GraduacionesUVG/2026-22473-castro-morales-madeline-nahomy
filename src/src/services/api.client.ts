/** Cliente HTTP base para la API de CONGENIA M1. */

import { v4 as uuidv4 } from 'uuid'
import { API_BASE_URL } from '../config/runtime'

const BASE_URL = API_BASE_URL

const DEFAULT_TIMEOUT_MS = 30_000

let _sessionToken: string | null = null

export function setSessionToken(token: string | null): void {
    _sessionToken = token
}

export class ApiError extends Error {
    readonly status: number
    readonly code: string
    readonly requestId: string

    constructor(status: number, code: string, message: string, requestId: string) {
        super(message)
        this.name = 'ApiError'
        this.status = status
        this.code = code
        this.requestId = requestId
    }
}

export type ApiAuthMode = 'session' | 'bearer'

let _accessTokenProvider: (() => Promise<string>) | null = null

export function setAccessTokenProvider(provider: (() => Promise<string>) | null): void {
    _accessTokenProvider = provider
}

export interface AuthFailureHandlers {
    onUnauthorized?: () => void
    onForbidden?: () => void
}

let _authFailureHandlers: AuthFailureHandlers = {}

export function setAuthFailureHandlers(handlers: AuthFailureHandlers): void {
    _authFailureHandlers = handlers
}

interface ApiFetchOptions extends Omit<RequestInit, 'signal'> {
    bearer?: boolean
    timeoutMs?: number
    sensitive?: boolean
    auth?: ApiAuthMode
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
    const { timeoutMs = DEFAULT_TIMEOUT_MS, sensitive = false, auth = 'session', ...init } = options

    const requestId = uuidv4()

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    const method = (init.method ?? 'GET').toUpperCase()
    const headers = new Headers(init.headers)

    if (auth === 'bearer') {
        headers.set('X-Request-Id', requestId)

        if (!headers.has('Authorization') && _accessTokenProvider) {
            headers.set('Authorization', `Bearer ${await _accessTokenProvider()}`)
        }
    } else if (method !== 'GET') {
        headers.set('X-Request-Id', requestId)

        if (_sessionToken) {
            headers.set('X-Session-Token', _sessionToken)
        }
    } else if (_sessionToken) {
        headers.set('X-Request-Id', requestId)
        headers.set('X-Session-Token', _sessionToken)
    } else if (_accessTokenProvider) {
        headers.set('X-Request-Id', requestId)
        headers.set('Authorization', `Bearer ${await _accessTokenProvider()}`)
    }

    if (sensitive) {
        headers.set('Cache-Control', 'no-store')
    }

    if (init.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
    }

    try {
        const response = await fetch(`${BASE_URL}${path}`, {
            ...init,
            ...(sensitive ? { cache: 'no-store' as const } : {}),
            headers,
            signal: controller.signal,
        })

        if (!response.ok) {
            const body = await response.json().catch(() => ({}))

            const usedBearer = (headers.get('Authorization') ?? '').startsWith('Bearer ')
                && !headers.has('X-Session-Token')
            if (usedBearer && response.status === 401) {
                _authFailureHandlers.onUnauthorized?.()
            } else if (usedBearer && response.status === 403 && body.error === 'FORBIDDEN') {
                _authFailureHandlers.onForbidden?.()
            }

            console.error(
                `[CONGENIA API] ${method} → ${response.status} (reqId: ${requestId})`
            )

            throw new ApiError(
                response.status,
                body.error ?? 'API_ERROR',
                body.message ?? `HTTP ${response.status}`,
                requestId,
            )
        }

        if (response.status === 204) return undefined as T
        return response.json() as Promise<T>
    } catch (err) {
        if (err instanceof ApiError) throw err

        if (err instanceof Error && err.name === 'AbortError') {
            throw new ApiError(408, 'REQUEST_TIMEOUT', 'La petición superó el tiempo límite', requestId)
        }

        console.error(`[CONGENIA API] Error de red (reqId: ${requestId})`)
        throw new ApiError(0, 'NETWORK_ERROR', 'Error de conexión con el servidor', requestId)
    } finally {
        clearTimeout(timer)
    }
}

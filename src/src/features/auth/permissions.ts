/** Permisos del médico autenticado calculados a partir de GET /me. */

import type { MeProfile, TenantOption } from '../../services/ficha.service'

export type Permission =
    | 'dashboard'
    | 'fichas.crear'
    | 'adendas.revisar'
    | 'cie10.corregir'
    | 'reporteria'

export interface TenantAccess extends TenantOption {
    permissions: ReadonlySet<string>
}

export interface Access {
    permissions: ReadonlySet<string>
    roleLabel: string
    tenants: readonly TenantAccess[]
}

export const NO_ACCESS: Access = { permissions: new Set(), roleLabel: '', tenants: [] }

function strings(value: unknown): string[] {
    return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === 'string')
        : []
}

export function accessFromMe(me: MeProfile): Access {
    return {
        permissions: new Set(strings(me.permissions)),
        roleLabel: typeof me.roleLabel === 'string' ? me.roleLabel : '',
        tenants: (Array.isArray(me.access) ? me.access : []).map((entry) => {
            const id = String(entry.tenantId)
            return {
                id,
                name: entry.name ?? id,
                label: entry.label ?? id,
                permissions: new Set(strings(entry.permissions)),
            }
        }),
    }
}

export function can(access: Access | null | undefined, permission: Permission): boolean {
    return access?.permissions.has(permission) === true
}

export function tenantsWith(access: Access | null | undefined, permission: Permission): TenantOption[] {
    return (access?.tenants ?? [])
        .filter((tenant) => tenant.permissions.has(permission))
        .map(({ id, name, label }) => ({ id, name, label }))
}

export function prefersDashboard(access: Access | null | undefined): boolean {
    if (!can(access, 'dashboard')) return false
    if (!can(access, 'fichas.crear')) return true
    return can(access, 'adendas.revisar')
        || can(access, 'cie10.corregir')
        || can(access, 'reporteria')
}

export function roleLabelOf(access: Access | null | undefined): string {
    return access?.roleLabel ?? ''
}

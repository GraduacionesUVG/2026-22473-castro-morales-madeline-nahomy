/** Normalización de las instituciones (tenants) que se ofrecen en el selector de búsqueda. */

export interface TenantSelectOption {
    id: string
    name?: string
    label?: string
}

export interface NormalizedTenantOption {
    id: string
    label: string
}

export function normalizeTenantOptions(
    tenantOptions: Array<string | TenantSelectOption>,
): NormalizedTenantOption[] {
    return tenantOptions.map((option) => {
        if (typeof option === 'string') return { id: option, label: option }
        return { id: option.id, label: option.label ?? `${option.id}${option.name ? ` - ${option.name}` : ''}` }
    })
}

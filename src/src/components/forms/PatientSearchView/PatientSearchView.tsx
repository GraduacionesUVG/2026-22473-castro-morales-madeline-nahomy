/** Pantalla de búsqueda de pacientes por historia clínica e institución. */

import { useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import styles from './PatientSearchView.module.css'
import { BrandCard } from '../../ui/BrandCard/BrandCard'
import { AppTopBar } from '../../ui/AppTopBar/AppTopBar'
import { Input } from '../../ui/Input/Input'
import { Button } from '../../ui/Button/Button'
import { InlineNotice } from '../../ui/InlineNotice/InlineNotice'
import { normalizeTenantOptions } from './tenantOptions'
import type { TenantSelectOption } from './tenantOptions'

export type { TenantSelectOption }

export interface PatientSearchViewProps {
    onSearch: (historiaClinica: string, idTenant: string) => void
    isLoading?: boolean
    initialHistoriaClinica?: string
    tenantOptions: Array<string | TenantSelectOption>
    tenantId: string
    onTenantIdChange: (tenantId: string) => void
    authenticatedUser?: string
    onLogout?: () => void
    onGoToDashboard?: () => void
    notFound?: { historiaClinica: string; tenantId: string } | null
    onManualRegister?: () => void
    onNotFoundDismiss?: () => void
}

interface FieldErrors {
    historiaClinica?: string
    idTenant?: string
}

export function PatientSearchView({
    onSearch,
    isLoading = false,
    initialHistoriaClinica = '',
    tenantOptions,
    tenantId,
    onTenantIdChange,
    authenticatedUser,
    onLogout,
    onGoToDashboard,
    notFound = null,
    onManualRegister,
    onNotFoundDismiss,
}: PatientSearchViewProps) {
    const [historiaClinica, setHistoriaClinica] = useState(initialHistoriaClinica)
    const [errors, setErrors] = useState<FieldErrors>({})
    const historiaRef = useRef<HTMLInputElement>(null)
    const normalizedTenantOptions = useMemo(() => normalizeTenantOptions(tenantOptions), [tenantOptions])
    const hasTenantOptions = normalizedTenantOptions.length > 0
    const showNotFound = notFound !== null
        && notFound.historiaClinica === historiaClinica.trim()
        && notFound.tenantId === tenantId
    const tenantLabel = normalizedTenantOptions.find((option) => option.id === tenantId)?.label ?? tenantId

    const corregirNumero = () => {
        onNotFoundDismiss?.()
        historiaRef.current?.focus()
        historiaRef.current?.select()
    }

    const validate = (): FieldErrors => {
        const next: FieldErrors = {}

        if (historiaClinica.trim() === '') {
            next.historiaClinica = 'Escriba el número de historia clínica.'
        }

        if (!normalizedTenantOptions.some((option) => option.id === tenantId)) {
            next.idTenant = 'Seleccione una institución autorizada.'
        }

        return next
    }

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (isLoading) return

        const nextErrors = validate()
        setErrors(nextErrors)
        if (Object.keys(nextErrors).length > 0) return

        onSearch(historiaClinica.trim(), tenantId)
    }

    return (
        <BrandCard
            layout="split"
            topBar={<AppTopBar userName={authenticatedUser} onLogout={onLogout} onGoToDashboard={onGoToDashboard} />}
            hero={
                <div className={styles.hero}>
                    <h1 className={styles.title}>Búsqueda de pacientes</h1>
                    <p className={styles.subtitle}>
                        Seleccione la institución y escriba el número de historia clínica para continuar.
                    </p>
                </div>
            }
        >
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
                <Input
                    ref={historiaRef}
                    label="Número historia clínica"
                    value={historiaClinica}
                    onChange={(e) => {
                        setHistoriaClinica(e.target.value)
                        setErrors((prev) => ({ ...prev, historiaClinica: undefined }))
                        if (notFound) onNotFoundDismiss?.()
                    }}
                    error={errors.historiaClinica}
                    placeholder="Ej. 12345678"
                    inputMode="numeric"
                    autoComplete="off"
                    disabled={isLoading}
                />

                <label className={styles.tenantField}>
                    Institución
                    <select value={tenantId} onChange={(e) => {
                        onTenantIdChange(e.target.value)
                        setErrors((prev) => ({ ...prev, idTenant: undefined }))
                        if (notFound) onNotFoundDismiss?.()
                    }}disabled={isLoading || !hasTenantOptions} aria-invalid={Boolean(errors.idTenant)}>
                        <option value="">Seleccione una institución</option>
                        {normalizedTenantOptions.map((tenant) => (
                            <option key={tenant.id} value={tenant.id}>{tenant.label}</option>
                        ))}
                    </select>
                    {errors.idTenant && <span role="alert">{errors.idTenant}</span>}
                </label>

                {!hasTenantOptions && (
                    <InlineNotice tone="danger" className={styles.sinInstituciones}>
                        No tiene instituciones donde pueda registrar fichas. Contacte al administrador.
                    </InlineNotice>
                )}

                {showNotFound ? (
                    <>
                        <div role="status">
                            <InlineNotice tone="warning">
                                <strong>No se encontró la historia clínica {notFound.historiaClinica}</strong>{' '}
                                en {tenantLabel}. Revise el número. Si es correcto, el paciente no está registrado en SADC.
                            </InlineNotice>
                        </div>
                        <div className={styles.notFoundActions}>
                            <Button type="button" variant="secondary" fullWidth onClick={corregirNumero}>
                                Corregir número
                            </Button>
                            <Button type="button" variant="primary" fullWidth onClick={onManualRegister}>
                                Registrar manualmente
                            </Button>
                        </div>
                    </>
                ) : (
                    <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        isLoading={isLoading}
                        disabled={!hasTenantOptions}
                        className={styles.submitButton}
                    >
                        Buscar
                    </Button>
                )}
            </form>
        </BrandCard>
    )
}

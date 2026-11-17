/** Guarda de una sección del dashboard que exige su permiso. */

import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ShieldX } from 'lucide-react'
import styles from './RequirePermission.module.css'
import { useAuth } from './useAuth'
import { can, type Permission } from './permissions'
import { ROUTES } from '../../app/routes'

export function RequirePermission({ permission, children }: { permission: Permission; children: ReactNode }) {
    const { state } = useAuth()
    const access = state.status === 'authenticated' ? state.access : null

    if (!can(access, permission)) return <SectionDenied />

    return <>{children}</>
}

export function SectionDenied() {
    return (
        <section className={styles.denied} role="alert">
            <ShieldX size={28} className={styles.icon} aria-hidden="true" />
            <h2 className={styles.title}>Sin permiso para esta sección</h2>
            <p className={styles.message}>
                Su cuenta no tiene permiso para abrir esta sección. Si lo necesita, pida al
                administrador que se lo asigne.
            </p>
            <Link to={ROUTES.dashboard} className={styles.link}>Volver al inicio</Link>
        </section>
    )
}

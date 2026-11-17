/** Etiqueta de estado de una adenda. */

import styles from './StatusBadge.module.css'

export type StatusTone = 'pending' | 'approved' | 'rejected'

export interface StatusBadgeProps {
    tone: StatusTone
    children?: string
    className?: string
}

const DEFAULT_LABEL: Record<StatusTone, string> = {
    pending:  'PENDIENTE',
    approved: 'APROBADA',
    rejected: 'RECHAZADA',
}

export function StatusBadge({ tone, children, className }: StatusBadgeProps) {
    const classes = [styles.badge, styles[tone], className ?? ''].filter(Boolean).join(' ')

    return <span className={classes}>{children ?? DEFAULT_LABEL[tone]}</span>
}

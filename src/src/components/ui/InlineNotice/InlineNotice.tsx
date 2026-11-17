/** Aviso informativo en línea dentro de una sección. */

import type { ReactNode } from 'react'
import { CircleAlert, TriangleAlert } from 'lucide-react'
import styles from './InlineNotice.module.css'

export type InlineNoticeTone = 'info' | 'warning' | 'danger'

interface InlineNoticeProps {
    children: ReactNode
    tone?: InlineNoticeTone
    className?: string
}

export function InlineNotice({ children, tone = 'info', className }: InlineNoticeProps) {
    const Icono = tone === 'warning' ? TriangleAlert : CircleAlert

    const classes = [styles.notice, styles[tone], className ?? '']
        .filter(Boolean)
        .join(' ')

    return (
        <p className={classes}>
            <Icono className={styles.icon} size={16} aria-hidden="true" />
            <span>{children}</span>
        </p>
    )
}

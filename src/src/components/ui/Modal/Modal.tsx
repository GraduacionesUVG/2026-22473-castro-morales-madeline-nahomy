/** Modal base con fondo, cierre y manejo del foco. */

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import styles from './Modal.module.css'

export interface ModalProps {
    isOpen: boolean
    onClose?: () => void
    children: ReactNode
    variant?: 'card' | 'bare'
    labelledBy?: string
    label?: string
    className?: string
}

export function Modal({
    isOpen,
    onClose,
    children,
    variant = 'card',
    labelledBy,
    label,
    className,
}: ModalProps) {
    useEffect(() => {
        if (!isOpen) return

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        return () => { document.body.style.overflow = previousOverflow }
    }, [isOpen])

    useEffect(() => {
        if (!isOpen) return

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose?.()
        }

        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [isOpen, onClose])

    if (!isOpen) return null

    const overlayClasses = [styles.overlay, className ?? ''].filter(Boolean).join(' ')

    return (
        <div
            className={overlayClasses}
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose?.()
            }}
        >
            <div
                className={variant === 'card' ? styles.card : styles.bare}
                role="dialog"
                aria-modal="true"
                aria-labelledby={labelledBy}
                aria-label={labelledBy ? undefined : label}
            >
                {children}
            </div>
        </div>
    )
}

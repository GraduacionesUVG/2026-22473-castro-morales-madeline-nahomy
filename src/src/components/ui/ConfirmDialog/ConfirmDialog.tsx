/** Diálogo de confirmación para acciones que destruyen datos. */

import { useId } from 'react'
import type { ReactNode } from 'react'
import { Modal } from '../Modal/Modal'
import { Button } from '../Button/Button'
import styles from './ConfirmDialog.module.css'

export interface ConfirmDialogProps {
    isOpen: boolean
    title: string
    message?: ReactNode
    confirmLabel?: string
    cancelLabel?: string
    tone?: 'primary' | 'destructive'
    onConfirm: () => void
    onCancel: () => void
}

export function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel = 'Sí, continuar',
    cancelLabel = 'Cancelar',
    tone = 'primary',
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const titleId = useId()

    return (
        <Modal
            isOpen={isOpen}
            onClose={onCancel}
            labelledBy={titleId}
            className={styles.overlay}
        >
            <h2 id={titleId} className={styles.title}>{title}</h2>
            {message && <p className={styles.message}>{message}</p>}

            <div className={styles.actions}>
                <Button autoFocus variant="ghost" fullWidth onClick={onCancel}>
                    {cancelLabel}
                </Button>
                <Button variant={tone} fullWidth onClick={onConfirm}>
                    {confirmLabel}
                </Button>
            </div>
        </Modal>
    )
}

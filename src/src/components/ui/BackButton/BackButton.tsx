/** Botón redondo de regresar para la barra superior. */

import { Undo2 } from 'lucide-react'
import styles from './BackButton.module.css'

export interface BackButtonProps {
    onClick: () => void
    label: string
    className?: string
}

export function BackButton({ onClick, label, className }: BackButtonProps) {
    return (
        <button
            type="button"
            className={[styles.backButton, className ?? ''].filter(Boolean).join(' ')}
            onClick={onClick}
            aria-label={label}
            title={label}
        >
            <Undo2 size={20} aria-hidden="true" />
        </button>
    )
}

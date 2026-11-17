/** Pantalla de carga a pantalla completa con mensaje. */

import styles from './LoadingView.module.css'
import { BrandCard } from '../../ui/BrandCard/BrandCard'

export interface LoadingViewProps {
    message?: string
}

export function LoadingView({ message = 'Cargando' }: LoadingViewProps) {
    return (
        <BrandCard>
            <p className={styles.label} role="status" aria-live="polite">
                {message}
                <span className={styles.dots} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                </span>
            </p>
        </BrandCard>
    )
}

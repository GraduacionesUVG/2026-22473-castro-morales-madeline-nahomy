/** Contenedor de pantalla completa con la marca CONGENIA. */

import type { ReactNode } from 'react'
import styles from './BrandCard.module.css'
import logoCongenia from '../../../assets/CONGENIA LOGO.png'

interface BrandCardProps {
    children: ReactNode
    topBar?: ReactNode
    hero?: ReactNode
    layout?: 'centered' | 'split'
}

export function BrandCard({ children, topBar, hero, layout = 'centered' }: BrandCardProps) {
    return (
        <div className={styles.background}>
            {topBar && <div className={styles.topBarSlot}>{topBar}</div>}

            <div className={styles.main}>
                <div className={layout === 'split' ? styles.split : styles.centered}>
                    {hero}
                    <div className={styles.card}>
                        {!topBar && <img src={logoCongenia} alt="Congenia" className={styles.logo} />}
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}

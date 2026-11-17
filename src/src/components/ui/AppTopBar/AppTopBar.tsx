/** Barra superior de la aplicación con el logo y la sesión del usuario. */

import { LayoutDashboard, LogOut } from 'lucide-react'
import styles from './AppTopBar.module.css'
import logoC from '../../../assets/C.png'
import logoOngenia from '../../../assets/Ongenia.png'

export interface AppTopBarProps {
    userName?: string
    onLogout?: () => void
    onGoToDashboard?: () => void
}

export function AppTopBar({ userName, onLogout, onGoToDashboard }: AppTopBarProps) {
    return (
        <header className={styles.topBar}>
            <span className={styles.brand}>
                <img src={logoC} alt="" className={styles.brandMark} />
                <img src={logoOngenia} alt="Congenia" className={styles.brandWordmark} />
            </span>

            {userName && (
                <div className={styles.session}>
                    <span className={styles.identity}>
                        <span className={styles.identityPrefix}>Sesión:</span>
                        <span className={styles.userName} title={userName}>{userName}</span>
                    </span>

                    {onGoToDashboard && (
                        <button
                            type="button"
                            className={styles.actionButton}
                            onClick={onGoToDashboard}
                            aria-label="Ir a dashboard"
                            title="Ir a dashboard"
                        >
                            <LayoutDashboard size={16} aria-hidden="true" />
                            <span className={styles.dashboardLabel}>Ir a dashboard</span>
                        </button>
                    )}

                    {onLogout && (
                        <button type="button" className={styles.actionButton} onClick={onLogout}>
                            <LogOut size={16} aria-hidden="true" />
                            <span className={styles.labelLong}>Cerrar sesión</span>
                            <span className={styles.labelShort}>Salir</span>
                        </button>
                    )}
                </div>
            )}
        </header>
    )
}

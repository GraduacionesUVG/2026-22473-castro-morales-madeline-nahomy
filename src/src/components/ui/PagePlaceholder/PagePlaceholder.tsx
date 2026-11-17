/** Marcador de contenido pendiente para pantallas del dashboard. */

import styles from './PagePlaceholder.module.css'

export interface PagePlaceholderProps {
    title?: string
    description?: string
    note?: string
}

export function PagePlaceholder({ title, description, note }: PagePlaceholderProps) {
    return (
        <section className={styles.wrapper}>
            {(title ?? description) && (
                <header className={styles.heading}>
                    {title && <h2 className={styles.title}>{title}</h2>}
                    {description && <p className={styles.description}>{description}</p>}
                </header>
            )}

            <div className={styles.box}>
                <p className={styles.note}>{note ?? 'Aquí iría esto'}</p>
            </div>
        </section>
    )
}

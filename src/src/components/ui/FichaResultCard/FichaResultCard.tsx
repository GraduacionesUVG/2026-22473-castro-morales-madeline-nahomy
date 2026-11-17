/** Tarjeta de un resultado de la búsqueda de fichas. */

import type { FichaResumen } from '../../../types/ficha-search'
import styles from './FichaResultCard.module.css'

export interface FichaResultCardProps {
    ficha: FichaResumen
    onVerRegistro: (fichaId: string) => void
    className?: string
}

const FECHA_CORTA = new Intl.DateTimeFormat('es-GT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
})

function formatearFecha(iso: string): string {
    const [anio, mes, dia] = iso.split('-').map(Number)
    if (!anio || !mes || !dia) return iso

    return FECHA_CORTA.format(new Date(anio, mes - 1, dia)).replace(/\//g, '-')
}

export function FichaResultCard({ ficha, onVerRegistro, className }: FichaResultCardProps) {
    const classes = [styles.card, className ?? ''].filter(Boolean).join(' ')
    const href = `/dashboard/busqueda/${encodeURIComponent(ficha.fichaId)}`

    return (
        <article className={classes}>
            <header className={styles.header}>
                <h3 className={styles.name}>{ficha.nombrePaciente}</h3>
                <time className={styles.date} dateTime={ficha.fechaConsulta}>
                    {formatearFecha(ficha.fechaConsulta)}
                </time>
            </header>

            <dl className={styles.details}>
                <div className={styles.row}>
                    <dt className={styles.term}>No. Historia Clínica:</dt>
                    <dd className={styles.value}>{ficha.historiaClinica}</dd>
                </div>
            </dl>

            <a
                className={styles.openButton}
                href={href}
                onClick={(event) => {
                    event.preventDefault()
                    onVerRegistro(ficha.fichaId)
                }}
                aria-label={`Ver registro de ${ficha.nombrePaciente}`}
            >
                Ver registro
            </a>
        </article>
    )
}

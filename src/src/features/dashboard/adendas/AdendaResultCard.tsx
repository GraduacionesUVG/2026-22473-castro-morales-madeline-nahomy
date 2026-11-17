/** Tarjeta de una adenda en la bandeja. */

import { StatusBadge } from '../../../components/ui/StatusBadge/StatusBadge'
import type { AdendaResumen } from '../../../services/ficha.service'
import { adendaRoute } from '../../../app/routes'
import { TONO_POR_ESTADO } from './estados'
import styles from './AdendaResultCard.module.css'

export interface AdendaResultCardProps {
    adenda: AdendaResumen
    onVerRegistro: (fichaId: string) => void
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

export function AdendaResultCard({ adenda, onVerRegistro }: AdendaResultCardProps) {
    const href = adendaRoute(adenda.fichaId)

    return (
        <article className={styles.card}>
            <div className={styles.body}>
                <header className={styles.header}>
                    <h3 className={styles.name}>{adenda.paciente.nombre}</h3>
                    <StatusBadge tone={TONO_POR_ESTADO[adenda.estadoRevision]} />
                </header>

                <time className={styles.date} dateTime={adenda.fechaSolicitud}>
                    {formatearFecha(adenda.fechaSolicitud)}
                </time>

                <dl className={styles.details}>
                    <div className={styles.row}>
                        <dt className={styles.term}>No. Historia Clínica:</dt>
                        <dd className={styles.value}>{adenda.paciente.historiaClinica}</dd>
                    </div>
                    <div className={styles.row}>
                        <dt className={styles.term}>Pediatra que lo solicita:</dt>
                        <dd className={styles.value}>{adenda.medicoSolicitante}</dd>
                    </div>
                </dl>
            </div>

            <a
                className={styles.openButton}
                href={href}
                onClick={(event) => {
                    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
                    event.preventDefault()
                    onVerRegistro(adenda.fichaId)
                }}
                aria-label={`Ver registro de ${adenda.paciente.nombre}`}
            >
                Ver registro
            </a>
        </article>
    )
}

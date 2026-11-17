/** Vista de la búsqueda de fichas del dashboard. */

import type { FormEvent } from 'react'
import { CircleX, FileSearch, Search, TriangleAlert } from 'lucide-react'
import { Button } from '../../../components/ui/Button/Button'
import { DateRangeField, type DateRange } from '../../../components/ui/DateRangeField/DateRangeField'
import { FichaResultCard } from '../../../components/ui/FichaResultCard/FichaResultCard'
import type { FichaResumen } from '../../../types/ficha-search'
import styles from './BusquedaView.module.css'

export type BusquedaStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface BusquedaViewProps {
    q: string
    onQChange: (value: string) => void
    rango: DateRange
    onRangoChange: (value: DateRange) => void
    rangoError?: string
    onSubmit: () => void

    status: BusquedaStatus
    results: FichaResumen[]
    total: number
    errorMessage?: string

    hasMore: boolean
    isLoadingMore: boolean
    onLoadMore: () => void

    onVerRegistro: (fichaId: string) => void
}

const SKELETON_COUNT = 8

export function BusquedaView({
    q,
    onQChange,
    rango,
    onRangoChange,
    rangoError,
    onSubmit,
    status,
    results,
    total,
    errorMessage,
    hasMore,
    isLoadingMore,
    onLoadMore,
    onVerRegistro,
}: BusquedaViewProps) {
    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        onSubmit()
    }

    const showSkeletons = status === 'loading'

    return (
        <div className={styles.container}>
            <form className={styles.filters} onSubmit={handleSubmit} noValidate>
                <div className={styles.searchField}>
                    <input
                        type="search"
                        className={styles.searchInput}
                        value={q}
                        onChange={(event) => onQChange(event.target.value)}
                        placeholder="Nombre, apellido o no. historia clínica"
                        aria-label="Búsqueda por nombre, apellido o número de historia clínica"
                        autoComplete="off"
                    />
                </div>

                <DateRangeField
                    value={rango}
                    onChange={onRangoChange}
                    error={rangoError}
                />

                <Button
                    type="submit"
                    variant="primary"
                    className={styles.submitButton}
                    isLoading={status === 'loading'}
                    aria-label="Buscar"
                    title="Buscar"
                >
                    {status !== 'loading' && <Search size={20} aria-hidden="true" />}
                </Button>
            </form>

            {showSkeletons && (
                <div className={styles.grid} aria-busy="true" aria-label="Cargando resultados">
                    {Array.from({ length: SKELETON_COUNT }, (_, index) => (
                        <div key={index} className={styles.skeleton} />
                    ))}
                </div>
            )}

            {status === 'idle' && (
                <div className={styles.state}>
                    <FileSearch size={40} className={styles.stateIcon} aria-hidden="true" />
                    <span className={styles.stateTitle}>Busque una ficha clínica</span>
                    <p className={styles.stateText}>
                        Escriba el nombre del paciente o su número de historia clínica. Si
                        busca sin escribir nada, verá las fichas del último mes; amplíe el
                        rango de fechas para ir más atrás.
                    </p>
                </div>
            )}

            {status === 'error' && (
                <div className={`${styles.state} ${styles.stateError}`} role="alert">
                    <TriangleAlert size={40} className={styles.stateIcon} aria-hidden="true" />
                    <span className={styles.stateTitle}>No se pudo completar la búsqueda</span>
                    <p className={styles.stateText}>{errorMessage}</p>
                    <Button variant="ghost" onClick={onSubmit}>Reintentar</Button>
                </div>
            )}

            {status === 'ready' && results.length === 0 && (
                <div className={`${styles.state} ${styles.stateEmpty}`}>
                    <CircleX size={40} className={styles.stateIcon} aria-hidden="true" />
                    <span className={styles.stateTitle}>No se encontraron resultados</span>
                    <p className={styles.stateText}>
                        Revise que el nombre o apellido estén completos (no permite palabras
                        a medias) o amplíe el rango de fechas.
                    </p>
                </div>
            )}

            {status === 'ready' && results.length > 0 && (
                <>
                    <div className={styles.grid}>
                        {results.map((ficha) => (
                            <FichaResultCard
                                key={ficha.fichaId}
                                ficha={ficha}
                                onVerRegistro={onVerRegistro}
                            />
                        ))}
                    </div>

                    <div className={styles.footer}>
                        <span className={styles.count} aria-live="polite">
                            {results.length} de {total} {total === 1 ? 'ficha' : 'fichas'}
                        </span>

                        {hasMore && (
                            <Button
                                variant="ghost"
                                onClick={onLoadMore}
                                isLoading={isLoadingMore}
                            >
                                Cargar más
                            </Button>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

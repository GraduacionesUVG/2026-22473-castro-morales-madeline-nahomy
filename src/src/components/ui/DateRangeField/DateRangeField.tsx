/** Campo de rango de fechas (desde - hasta). */

import { useId } from 'react'
import { CalendarDays } from 'lucide-react'
import type { DateRange } from './dateRange'
import styles from './DateRangeField.module.css'

export type { DateRange } from './dateRange'

export interface DateRangeFieldProps {
    label?: string
    value: DateRange
    onChange: (value: DateRange) => void
    error?: string
    disabled?: boolean
    className?: string
}

export function DateRangeField({
    label,
    value,
    onChange,
    error,
    disabled = false,
    className,
}: DateRangeFieldProps) {
    const baseId = useId()
    const desdeId = `${baseId}-desde`
    const hastaId = `${baseId}-hasta`
    const errorId = `${baseId}-error`

    const classes = [
        styles.field,
        error ? styles.fieldError : '',
        disabled ? styles.fieldDisabled : '',
        className ?? '',
    ].filter(Boolean).join(' ')

    return (
        <div className={styles.wrapper}>
            {label && <span className={styles.label}>{label}</span>}

            <div className={classes}>
                <CalendarDays size={18} className={styles.icon} aria-hidden="true" />

                <label className={styles.slot} htmlFor={desdeId}>
                    <span className={styles.slotLabel}>Desde</span>
                    <input
                        id={desdeId}
                        type="date"
                        className={styles.input}
                        value={value.desde}
                        max={value.hasta || undefined}
                        disabled={disabled}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? errorId : undefined}
                        onChange={(event) => onChange({ ...value, desde: event.target.value })}
                    />
                </label>

                <span className={styles.separator} aria-hidden="true" />

                <label className={styles.slot} htmlFor={hastaId}>
                    <span className={styles.slotLabel}>Hasta</span>
                    <input
                        id={hastaId}
                        type="date"
                        className={styles.input}
                        value={value.hasta}
                        min={value.desde || undefined}
                        disabled={disabled}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? errorId : undefined}
                        onChange={(event) => onChange({ ...value, hasta: event.target.value })}
                    />
                </label>
            </div>

            {error && <span id={errorId} className={styles.errorMessage}>{error}</span>}
        </div>
    )
}

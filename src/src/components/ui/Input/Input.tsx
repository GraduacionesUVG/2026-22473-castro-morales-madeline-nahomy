/** Campo de texto base. */

import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import styles from './Input.module.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string
    error?: string
    hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, hint, readOnly, className, id, ...rest }, ref) => {
        const inputId = id ?? `input-${label.toLowerCase().replace(/\s+/g, '-')}`

        const inputClasses = [
            styles.input,
            readOnly ? styles.readonly : '',
            error ? styles.inputError : '',
            className ?? '',
        ].filter(Boolean).join(' ')

        return (
            <div className={styles.wrapper}>
                <label htmlFor={inputId} className={styles.label}>
                    {label}
                </label>

                <input
                    ref={ref}
                    id={inputId}
                    readOnly={readOnly}
                    className={inputClasses}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
                    {...rest}
                />

                {error && (
                    <span
                        id={`${inputId}-error`}
                        className={styles.errorMessage}
                        role="alert"
                    >
                        {error}
                    </span>
                )}

                {!error && hint && (
                    <span id={`${inputId}-hint`} className={styles.hint}>
                        {hint}
                    </span>
                )}
            </div>
        )
    }
)

Input.displayName = 'Input'
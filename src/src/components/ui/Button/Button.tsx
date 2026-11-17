/** Botón base con variantes primaria, secundaria, destructiva y fantasma. */

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'destructive' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    leftIcon?: ReactNode
    isLoading?: boolean
    fullWidth?: boolean
    children: ReactNode
}

export function Button({
    variant = 'primary',
    size = 'md',
    leftIcon,
    isLoading = false,
    fullWidth = false,
    children,
    disabled,
    className,
    ...rest
}: ButtonProps) {
    const classes = [
        styles.button,
        styles[variant],
        styles[size],
        fullWidth ? styles.fullWidth : '',
        isLoading ? styles.loading : '',
        className ?? '',
    ].filter(Boolean).join(' ')

    return (
        <button
        className={classes}
        disabled={disabled || isLoading}
        type="button"
        {...rest}
        >
        {isLoading && (
            <span className={styles.spinner} aria-hidden="true" />
        )}
        {!isLoading && leftIcon && (
            <span className={styles.icon} aria-hidden="true">
            {leftIcon}
            </span>
        )}
        <span>{children}</span>
        </button>
    )
}
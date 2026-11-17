/** Tarjeta de un elemento de la ficha con imagen, chips y estado. */

import { useState } from 'react'
import type { ReactNode } from 'react'
import { ImageOff } from 'lucide-react'
import styles from './MediaCard.module.css'

export type MediaCardChip = string

export type MediaCardStatus = 'active' | 'replaced'

interface MediaCardProps {
    title: string
    imageSrc?: string
    imageAlt?: string
    chips?: MediaCardChip[]
    status?: MediaCardStatus
    onRemove?: () => void
    onCardClick?: () => void
    className?: string
    leftSlot?: ReactNode
    id?: string
    highlighted?: boolean
}

export function MediaCard({
    title,
    imageSrc,
    imageAlt,
    chips,
    status,
    onRemove,
    onCardClick,
    className,
    leftSlot,
    id,
    highlighted = false,
}: MediaCardProps) {
    const classes = [
        styles.card,
        status === 'replaced' ? styles.cardReplaced : '',
        highlighted ? styles.cardHighlighted : '',
        className ?? '',
    ].filter(Boolean).join(' ')
    const showChips = Boolean(chips && chips.length > 0)
    const isClickable = Boolean(onCardClick)

    const [srcFallido, setSrcFallido] = useState<string | undefined>()

    const mostrarImagen = Boolean(imageSrc) && imageSrc !== srcFallido

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!isClickable) return
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onCardClick?.()
        }
    }

    return (
        <div
            id={id}
            className={classes}
            onClick={onCardClick}
            onKeyDown={handleKeyDown}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
        >
            {(leftSlot || imageSrc) && (
                <div className={styles.left}>
                    {leftSlot ? (
                        leftSlot
                    ) : mostrarImagen ? (
                        <img
                            src={imageSrc}
                            alt={imageAlt ?? title}
                            className={styles.thumbnail}
                            onError={() => setSrcFallido(imageSrc)}
                        />
                    ) : (
                        <div className={styles.placeholder} aria-hidden="true">
                            <ImageOff size={22} />
                        </div>
                    )}
                </div>
            )}

            <div className={styles.body}>
                <span className={styles.title}>{title}</span>
                {showChips && (
                    <div className={styles.chips}>
                        {chips?.map((chip, index) => (
                            <span key={`${chip}-${index}`} className={styles.chip}>
                                {chip}
                            </span>
                        ))}
                    </div>
                )}
                {status && (
                    <span className={status === 'replaced' ? styles.badgeReplaced : styles.badgeActive}>
                        {status === 'replaced' ? 'CAMBIADA' : 'ACTIVA'}
                    </span>
                )}
            </div>

            {onRemove && (
                <button
                    type="button"
                    className={styles.removeButton}
                    onClick={(event) => {
                        event.stopPropagation()
                        onRemove()
                    }}
                    aria-label="Eliminar"
                >
                    <span className={styles.removeIcon} aria-hidden="true">
                        <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M3 3L9 9M9 3L3 9"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                            />
                        </svg>
                    </span>
                </button>
            )}
        </div>
    )
}

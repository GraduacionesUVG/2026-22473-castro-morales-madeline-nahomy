/** Pestañas subrayadas. */

import { useRef } from 'react'
import styles from './Tabs.module.css'

export interface TabItem {
    id: string
    label: string
    count?: number
}

export interface TabsProps {
    items: TabItem[]
    activeId: string
    onChange: (id: string) => void
    label: string
    variant?: 'underline' | 'segmented'
    className?: string
}

export function Tabs({ items, activeId, onChange, label, variant = 'underline', className }: TabsProps) {
    const refs = useRef<Record<string, HTMLButtonElement | null>>({})

    const move = (delta: number) => {
        const index = items.findIndex((item) => item.id === activeId)
        if (index < 0) return
        const next = items[(index + delta + items.length) % items.length]
        onChange(next.id)
        refs.current[next.id]?.focus()
    }

    const jumpTo = (item: TabItem) => {
        onChange(item.id)
        refs.current[item.id]?.focus()
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'ArrowRight')      { event.preventDefault(); move(1) }
        else if (event.key === 'ArrowLeft')  { event.preventDefault(); move(-1) }
        else if (event.key === 'Home')       { event.preventDefault(); jumpTo(items[0]) }
        else if (event.key === 'End')        { event.preventDefault(); jumpTo(items[items.length - 1]) }
    }

    return (
        <div
            className={[
                styles.tablist,
                variant === 'segmented' ? styles.segmented : '',
                className ?? '',
            ].filter(Boolean).join(' ')}
            role="tablist"
            aria-label={label}
            onKeyDown={handleKeyDown}
        >
            {items.map((item) => {
                const selected = item.id === activeId

                return (
                    <button
                        key={item.id}
                        ref={(node) => { refs.current[item.id] = node }}
                        type="button"
                        role="tab"
                        id={`tab-${item.id}`}
                        aria-selected={selected}
                        aria-controls={`panel-${item.id}`}
                        tabIndex={selected ? 0 : -1}
                        className={selected ? `${styles.tab} ${styles.tabActive}` : styles.tab}
                        onClick={() => onChange(item.id)}
                    >
                        {item.label}
                        {item.count !== undefined && (
                            <span className={styles.count}>{item.count}</span>
                        )}
                    </button>
                )
            })}
        </div>
    )
}

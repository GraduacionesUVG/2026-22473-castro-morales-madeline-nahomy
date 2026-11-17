/** Botón que abre un globo informativo anclado al hacer clic. */

import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode, ToggleEvent } from 'react'
import styles from './Cie10BatchReview.module.css'

export interface PopoverAncladoProps {
    etiqueta: string
    icono: ReactNode
    children: ReactNode
    alinear?: 'start' | 'end'
    botonClassName?: string
}

const ANCHO = 320
const MARGEN = 8

export function PopoverAnclado({ etiqueta, icono, children, alinear = 'start', botonClassName }: PopoverAncladoProps) {
    const id = useId()
    const botonRef = useRef<HTMLButtonElement>(null)
    const globoRef = useRef<HTMLDivElement>(null)
    const [abierto, setAbierto] = useState(false)

    const posicionar = (event: ToggleEvent<HTMLDivElement>) => {
        const boton = botonRef.current
        const globo = globoRef.current
        if (event.newState !== 'open' || !boton || !globo) return
        const r = boton.getBoundingClientRect()
        const deseado = alinear === 'end' ? r.right - ANCHO : r.left
        const left = Math.min(Math.max(MARGEN, deseado), window.innerWidth - ANCHO - MARGEN)
        globo.style.top = `${r.bottom + 6}px`
        globo.style.left = `${Math.max(MARGEN, left)}px`
    }

    useEffect(() => {
        if (!abierto) return
        const cerrar = () => globoRef.current?.hidePopover()
        window.addEventListener('scroll', cerrar, true)
        window.addEventListener('resize', cerrar)
        return () => {
            window.removeEventListener('scroll', cerrar, true)
            window.removeEventListener('resize', cerrar)
        }
    }, [abierto])

    return (
        <>
            <button
                ref={botonRef}
                type="button"
                className={botonClassName ?? styles.iconoBoton}
                popoverTarget={id}
                aria-label={etiqueta}
                aria-expanded={abierto}
            >
                {icono}
            </button>
            <div
                ref={globoRef}
                id={id}
                popover="auto"
                className={styles.globo}
                style={{ width: ANCHO }}
                onBeforeToggle={posicionar}
                onToggle={(event) => setAbierto(event.newState === 'open')}
            >
                {children}
            </div>
        </>
    )
}

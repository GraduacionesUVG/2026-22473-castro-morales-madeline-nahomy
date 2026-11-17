/** Buscador con lista desplegable del catálogo CIE-10 vigente. */

import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '../../../components/ui/Button/Button'
import type { CatalogoCie10Item } from '../../../types/cie10'
import { codigoLibre } from './lote'
import inputStyles from '../../../components/ui/Input/Input.module.css'
import styles from './Cie10BatchReview.module.css'

export interface CatalogoCie10ComboboxProps {
    label: string
    buscar: (q: string) => Promise<CatalogoCie10Item[]>
    seleccion: CatalogoCie10Item | null
    onSeleccionar: (item: CatalogoCie10Item | null) => void
    error?: string
    autoFocus?: boolean
}

const MIN_LETRAS = 2
const ESPERA_MS = 250

type Estado = 'inactivo' | 'buscando' | 'listo' | 'error'

function itemLibre(codigo: string): CatalogoCie10Item {
    return { codigo, descripcion: '', codigoInterno: null, enCatalogoInstitucional: false, enReferenciaExterna: false }
}

const textoDe = (item: CatalogoCie10Item) => `${item.codigo} ${item.descripcion}`.trim()

export function CatalogoCie10Combobox({ label, buscar, seleccion, onSeleccionar, error, autoFocus }: CatalogoCie10ComboboxProps) {
    const baseId = useId()
    const inputId = `${baseId}-input`
    const listaId = `${baseId}-lista`
    const [texto, setTexto] = useState(() => (seleccion ? textoDe(seleccion) : ''))
    const [resultados, setResultados] = useState<CatalogoCie10Item[]>([])
    const [estado, setEstado] = useState<Estado>('inactivo')
    const [activo, setActivo] = useState(-1)
    const peticion = useRef(0)

    const consulta = seleccion ? '' : texto.trim()
    const corta = consulta.length < MIN_LETRAS

    useEffect(() => {
        if (corta) return
        const id = ++peticion.current
        const timer = window.setTimeout(() => {
            setEstado('buscando')
            buscar(consulta).then(
                (items) => {
                    if (id !== peticion.current) return
                    setResultados(items)
                    setActivo(0)
                    setEstado('listo')
                },
                () => { if (id === peticion.current) setEstado('error') },
            )
        }, ESPERA_MS)
        return () => window.clearTimeout(timer)
    }, [consulta, corta, buscar])

    const abierta = !seleccion && !corta && estado !== 'inactivo'

    const opciones = resultados
    const codigoEscrito = estado === 'listo' ? codigoLibre(consulta) : null
    const libre = codigoEscrito && !resultados.some((r) => r.codigo === codigoEscrito) ? codigoEscrito : null

    const elegir = (item: CatalogoCie10Item) => {
        onSeleccionar(item)
        setTexto(textoDe(item))
        setEstado('inactivo')
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (!abierta) return
        if (event.key === 'ArrowDown') {
            event.preventDefault()
            setActivo((i) => Math.min(opciones.length - 1, i + 1))
        } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            setActivo((i) => Math.max(0, i - 1))
        } else if (event.key === 'Enter' && opciones[activo]) {
            event.preventDefault()
            elegir(opciones[activo])
        } else if (event.key === 'Escape') {
            event.stopPropagation()
            setEstado('inactivo')
        }
    }

    const opcionId = (i: number) => `${baseId}-op-${i}`
    const ayudaId = `${inputId}-ayuda`

    return (
        <div className={inputStyles.wrapper}>
            <label htmlFor={inputId} className={inputStyles.label}>{label}</label>

            <div className={styles.comboboxCampo}>
                <Search size={18} className={styles.comboboxLupa} aria-hidden="true" />
                <input
                    id={inputId}
                    className={`${inputStyles.input} ${styles.comboboxInput} ${error ? inputStyles.inputError : ''}`}
                    value={texto}
                    autoFocus={autoFocus}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="Buscar por código o descripción"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={abierta}
                    aria-controls={listaId}
                    aria-activedescendant={abierta && opciones[activo] ? opcionId(activo) : undefined}
                    aria-invalid={!!error}
                    aria-describedby={ayudaId}
                    onKeyDown={handleKeyDown}
                    onChange={(event) => {
                        setTexto(event.target.value)
                        if (seleccion) onSeleccionar(null)
                    }}
                />
            </div>

            {error
                ? <span id={ayudaId} className={inputStyles.errorMessage} role="alert">{error}</span>
                : !seleccion && (
                    <span id={ayudaId} className={inputStyles.hint}>
                        Por ejemplo S83 o esguince. Si el código no está, escríbalo completo para usarlo.
                    </span>
                )}

            {abierta && (
                <ul id={listaId} role="listbox" aria-label="Resultados del catálogo CIE-10" className={styles.comboboxLista}>
                    {estado === 'buscando' && <li className={styles.comboboxEstado}>Buscando en el catálogo...</li>}
                    {estado === 'error' && <li className={styles.comboboxEstado}>No se pudo consultar el catálogo.</li>}
                    {estado === 'listo' && opciones.length === 0 && (
                        <li className={styles.comboboxEstado}>
                            {libre
                                ? `${libre} no está en el catálogo vigente.`
                                : 'Sin resultados. Para usar un código que no está en el catálogo, escríbalo completo, por ejemplo R69.'}
                        </li>
                    )}
                    {estado === 'listo' && opciones.map((item, i) => (
                        <li
                            key={item.codigo}
                            id={opcionId(i)}
                            role="option"
                            aria-selected={i === activo}
                            className={`${styles.comboboxOpcion} ${i === activo ? styles.comboboxOpcionActiva : ''}`}
                            onMouseDown={(event) => { event.preventDefault(); elegir(item) }}
                            onMouseEnter={() => setActivo(i)}
                        >
                            <strong>{item.codigo}</strong>
                            <span className={styles.comboboxDescripcion}>{item.descripcion}</span>
                            {!item.enCatalogoInstitucional && (
                                <span className={styles.comboboxExterno}>Referencia externa</span>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {abierta && libre && (
                <div className={styles.comboboxLibre}>
                    <Button size="sm" leftIcon={<Plus size={16} aria-hidden="true" />} onClick={() => elegir(itemLibre(libre))}>
                        Registrar {libre} como corrección médica
                    </Button>
                </div>
            )}
        </div>
    )
}

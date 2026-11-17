/** Modal para importar un tablero de reportería desde una copia exportada. */

import { useEffect, useId, useRef, useState, type DragEvent } from 'react'
import { FileUp } from 'lucide-react'
import { Button } from '../../../components/ui/Button/Button'
import { InlineNotice } from '../../../components/ui/InlineNotice/InlineNotice'
import { Modal } from '../../../components/ui/Modal/Modal'
import {
    ArchivoInvalidoError,
    contarTarjetas,
    leerArchivoSubido,
    NOMBRE_DASHBOARD,
    PREFIJO_ARCHIVO_TABLERO,
    type Tableros,
} from './tablero'
import styles from './TableroModales.module.css'

export interface ImportarTableroModalProps {
    isOpen: boolean
    onClose: () => void
    onImportar: (tableros: Tableros) => void
}

export function ImportarTableroModal({ isOpen, onClose, onImportar }: ImportarTableroModalProps) {
    const tituloId = useId()

    return (
        <Modal isOpen={isOpen} onClose={onClose} labelledBy={tituloId} className={styles.overlay}>
            <Contenido tituloId={tituloId} onClose={onClose} onImportar={onImportar} />
        </Modal>
    )
}

type Estado =
    | { status: 'vacio' }
    | { status: 'leyendo' }
    | { status: 'error'; mensaje: string }
    | { status: 'listo'; nombre: string; tableros: Tableros }

function Contenido({ tituloId, onClose, onImportar }: Omit<ImportarTableroModalProps, 'isOpen'> & { tituloId: string }) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [estado, setEstado] = useState<Estado>({ status: 'vacio' })
    const [encima, setEncima] = useState(false)
    const profundidad = useRef(0)
    const instruccionesId = useId()

    useEffect(() => {
        const evitar = (event: globalThis.DragEvent) => event.preventDefault()
        window.addEventListener('dragover', evitar)
        window.addEventListener('drop', evitar)
        return () => {
            window.removeEventListener('dragover', evitar)
            window.removeEventListener('drop', evitar)
        }
    }, [])

    const recibir = async (archivo: File | undefined) => {
        if (!archivo) return
        setEstado({ status: 'leyendo' })
        try {
            setEstado({ status: 'listo', nombre: archivo.name, tableros: await leerArchivoSubido(archivo) })
        } catch (error) {
            setEstado({
                status: 'error',
                mensaje: error instanceof ArchivoInvalidoError ? error.message : 'No se pudo leer este archivo.',
            })
        }
    }

    const alSoltar = (event: DragEvent<HTMLButtonElement>) => {
        event.preventDefault()
        profundidad.current = 0
        setEncima(false)
        void recibir(event.dataTransfer.files[0])
    }

    const clasesZona = [
        styles.dropzone,
        encima ? styles.dropzoneActive : '',
        estado.status === 'error' ? styles.dropzoneError : '',
    ].filter(Boolean).join(' ')

    return (
        <>
            <h2 id={tituloId} className={styles.title}>Recuperar un tablero guardado</h2>

            <p id={instruccionesId} className={styles.lead}>
                Use el archivo que descargó con la opción <strong>Exportar</strong>. Su nombre empieza
                con <span className={styles.fileName}>{PREFIJO_ARCHIVO_TABLERO}</span> y lleva la fecha en
                que lo guardó. Arrástrelo al recuadro o búsquelo en su computadora.
            </p>

            <button
                type="button"
                className={clasesZona}
                onClick={() => inputRef.current?.click()}
                onDragEnter={(event) => {
                    event.preventDefault()
                    profundidad.current += 1
                    setEncima(true)
                }}
                onDragOver={(event) => {
                    event.preventDefault()
                    event.dataTransfer.dropEffect = 'copy'
                }}
                onDragLeave={() => {
                    profundidad.current = Math.max(0, profundidad.current - 1)
                    if (profundidad.current === 0) setEncima(false)
                }}
                onDrop={alSoltar}
                disabled={estado.status === 'leyendo'}
                aria-describedby={instruccionesId}
            >
                <FileUp size={32} aria-hidden="true" className={styles.dropIcon} />
                <span className={styles.dropText}>
                    {estado.status === 'leyendo' ? 'Leyendo el archivo...' : 'Arrastre aquí el archivo del tablero'}
                </span>
                <span className={styles.dropHint}>o pulse para buscarlo en su computadora</span>
            </button>
            <input
                ref={inputRef}
                type="file"
                accept="application/json,.json"
                className={styles.srOnly}
                tabIndex={-1}
                aria-hidden="true"
                onChange={(event) => {
                    const archivo = event.target.files?.[0]
                    event.target.value = ''
                    void recibir(archivo)
                }}
            />

            {estado.status === 'error' && (
                <p className={styles.error} role="alert">{estado.mensaje}</p>
            )}

            {estado.status === 'listo' && <Resumen nombre={estado.nombre} tableros={estado.tableros} />}

            <div className={styles.actions}>
                <Button variant="ghost" fullWidth onClick={onClose}>Cancelar</Button>
                <Button
                    fullWidth
                    disabled={estado.status !== 'listo'}
                    onClick={() => { if (estado.status === 'listo') onImportar(estado.tableros) }}
                >
                    Reemplazar tablero
                </Button>
            </div>
        </>
    )
}

function Resumen({ nombre, tableros }: { nombre: string; tableros: Tableros }) {
    const { produccion, ficha } = contarTarjetas(tableros)
    const total = produccion + ficha

    return (
        <>
            <div className={styles.summary} role="status">
                <p className={styles.summaryName}>{nombre}</p>
                <p className={styles.summaryDetail}>
                    {total === 0
                        ? 'Trae los dos tableros sin tarjetas del agente.'
                        : `Trae ${total === 1 ? '1 tarjeta' : `${total} tarjetas`} del agente: `
                            + `${produccion} en ${NOMBRE_DASHBOARD.produccion} y ${ficha} en ${NOMBRE_DASHBOARD.ficha}.`}
                </p>
            </div>
            <InlineNotice tone="warning">
                Reemplaza lo que tiene ahora en los dos tableros. Si quiere conservarlo, cancele y exporte antes.
            </InlineNotice>
        </>
    )
}

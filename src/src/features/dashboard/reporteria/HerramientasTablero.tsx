/** Acciones del tablero de reportería: exportar, importar, descargar PDF y limpiar. */

import { useId, useState, type ReactNode } from 'react'
import { Download, Ellipsis, Eraser, FileDown, Upload } from 'lucide-react'
import { Button } from '../../../components/ui/Button/Button'
import { Modal } from '../../../components/ui/Modal/Modal'
import styles from './HerramientasTablero.module.css'

export interface HerramientasTableroProps {
    nombreTablero: string
    tarjetasAgente: number
    pdfDisponible: boolean
    generandoPdf: boolean
    onExportar: () => void
    onImportar: () => void
    onDescargarPdf: () => void
    onBorrar: () => void
}

export function HerramientasTablero({
    nombreTablero,
    tarjetasAgente,
    pdfDisponible,
    generandoPdf,
    onExportar,
    onImportar,
    onDescargarPdf,
    onBorrar,
}: HerramientasTableroProps) {
    const [hojaAbierta, setHojaAbierta] = useState(false)
    const tituloHojaId = useId()

    const sinTarjetas = tarjetasAgente === 0
    const borrarLabel = sinTarjetas
        ? `${nombreTablero} no tiene tarjetas del agente para borrar`
        : `Borrar las tarjetas del agente de ${nombreTablero}`

    const desdeHoja = (accion: () => void) => () => {
        setHojaAbierta(false)
        accion()
    }

    return (
        <>
            <div className={styles.acciones}>
                <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Download size={16} aria-hidden="true" />}
                    onClick={onExportar}
                >
                    Exportar
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Upload size={16} aria-hidden="true" />}
                    onClick={onImportar}
                >
                    Importar
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<FileDown size={16} aria-hidden="true" />}
                    onClick={onDescargarPdf}
                    disabled={!pdfDisponible}
                    isLoading={generandoPdf}
                >
                    Descargar PDF
                </Button>
                <span className={styles.separador} aria-hidden="true" />
                <button
                    type="button"
                    className={styles.iconButton}
                    onClick={onBorrar}
                    disabled={sinTarjetas}
                    aria-label={borrarLabel}
                    title={borrarLabel}
                >
                    <Eraser size={18} aria-hidden="true" />
                </button>
            </div>

            <div className={styles.opciones}>
                <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Ellipsis size={16} aria-hidden="true" />}
                    onClick={() => setHojaAbierta(true)}
                    isLoading={generandoPdf}
                    aria-haspopup="dialog"
                >
                    Opciones
                </Button>
            </div>

            <Modal
                isOpen={hojaAbierta}
                onClose={() => setHojaAbierta(false)}
                labelledBy={tituloHojaId}
                className={styles.hojaOverlay}
            >
                <h2 id={tituloHojaId} className={styles.hojaTitulo}>Opciones de {nombreTablero}</h2>
                <ul className={styles.hojaLista}>
                    <AccionHoja icono={<Download size={20} />} onClick={desdeHoja(onExportar)}>
                        Exportar tablero
                    </AccionHoja>
                    <AccionHoja icono={<Upload size={20} />} onClick={desdeHoja(onImportar)}>
                        Importar tablero
                    </AccionHoja>
                    <AccionHoja icono={<FileDown size={20} />} onClick={desdeHoja(onDescargarPdf)} disabled={!pdfDisponible}>
                        Descargar PDF
                    </AccionHoja>
                    <AccionHoja icono={<Eraser size={20} />} onClick={desdeHoja(onBorrar)} disabled={sinTarjetas} peligro>
                        Borrar tarjetas del agente
                    </AccionHoja>
                </ul>
                <Button variant="ghost" fullWidth onClick={() => setHojaAbierta(false)}>Cancelar</Button>
            </Modal>
        </>
    )
}

function AccionHoja({ icono, onClick, disabled, peligro, children }: {
    icono: ReactNode
    onClick: () => void
    disabled?: boolean
    peligro?: boolean
    children: ReactNode
}) {
    return (
        <li>
            <button
                type="button"
                className={peligro ? `${styles.hojaAccion} ${styles.peligro}` : styles.hojaAccion}
                onClick={onClick}
                disabled={disabled}
            >
                <span className={styles.hojaIcono} aria-hidden="true">{icono}</span>
                {children}
            </button>
        </li>
    )
}

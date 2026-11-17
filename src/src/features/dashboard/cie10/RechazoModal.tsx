/** Modal para rechazar una sugerencia CIE-10 y elegir el código correcto. */

import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { Modal } from '../../../components/ui/Modal/Modal'
import { Button } from '../../../components/ui/Button/Button'
import { InlineNotice } from '../../../components/ui/InlineNotice/InlineNotice'
import { buscarCatalogoCie10 } from '../../../services/cie10.service'
import type { CatalogoCie10Item } from '../../../types/cie10'
import { CatalogoCie10Combobox } from './CatalogoCie10Combobox'
import { esFueraDeCatalogo } from './lote'
import styles from './Cie10BatchReview.module.css'

export interface RechazoModalProps {
    isOpen: boolean
    diagnostico: string
    modo?: 'rechazar' | 'ingresar'
    codigoInicial?: string
    enviando: boolean
    onCancelar: () => void
    onEnviar: (codigo: string, fueraDeCatalogo: boolean) => void
    buscarCatalogo?: (q: string) => Promise<CatalogoCie10Item[]>
}

export function RechazoModal({ isOpen, ...resto }: RechazoModalProps) {
    const titleId = useId()

    return (
        <Modal isOpen={isOpen} onClose={resto.enviando ? undefined : resto.onCancelar} labelledBy={titleId}>
            <Formulario titleId={titleId} {...resto} />
        </Modal>
    )
}

function seleccionPrevia(codigo: string | undefined): CatalogoCie10Item | null {
    if (!codigo) return null
    return { codigo, descripcion: '', codigoInterno: null, enCatalogoInstitucional: true, enReferenciaExterna: false }
}

function Formulario({
    titleId,
    diagnostico,
    modo = 'rechazar',
    codigoInicial,
    enviando,
    onCancelar,
    onEnviar,
    buscarCatalogo = buscarCatalogoCie10,
}: Omit<RechazoModalProps, 'isOpen'> & { titleId: string }) {
    const [seleccion, setSeleccion] = useState<CatalogoCie10Item | null>(() => seleccionPrevia(codigoInicial))
    const [errorCodigo, setErrorCodigo] = useState<string | undefined>()

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (!seleccion) {
            setErrorCodigo('Elija un código del catálogo.')
            return
        }
        onEnviar(seleccion.codigo, esFueraDeCatalogo(seleccion))
    }

    return (
        <form className={styles.modalForm} onSubmit={handleSubmit} noValidate>
            <h2 id={titleId} className={styles.modalTitle}>
                {modo === 'ingresar' ? 'Ingresar código CIE-10' : 'Rechazar sugerencias'}
            </h2>
            <p className={styles.modalText}>
                {modo === 'ingresar'
                    ? <>El modelo no propuso un código para <strong>{diagnostico}</strong>.</>
                    : <>Ninguna sugerencia corresponde a <strong>{diagnostico}</strong>.</>}
                {' '}Elija el código CIE-10 correcto del catálogo.
            </p>

            <CatalogoCie10Combobox
                label="Corrección médica (código CIE-10)"
                buscar={buscarCatalogo}
                seleccion={seleccion}
                onSeleccionar={(item) => {
                    setSeleccion(item)
                    setErrorCodigo(undefined)
                }}
                error={errorCodigo}
                autoFocus
            />

            {seleccion && esFueraDeCatalogo(seleccion) && (
                <InlineNotice tone="warning">
                    {seleccion.codigo} no está en el catálogo vigente. Se guardará como código fuera de catálogo:
                    verifique que esté bien escrito.
                </InlineNotice>
            )}

            <div className={styles.modalActions}>
                <Button variant="destructive" fullWidth onClick={onCancelar} disabled={enviando}>
                    Cancelar
                </Button>
                <Button type="submit" variant="primary" fullWidth isLoading={enviando}>
                    Aceptar
                </Button>
            </div>
        </form>
    )
}

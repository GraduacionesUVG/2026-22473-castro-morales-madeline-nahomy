/** Sección Estudios de Gabinete Indicados de la ficha clínica, con carga de imágenes y PDF. */

import { useRef, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { v4 as uuidv4 } from 'uuid'
import styles from './ExamsSection.module.css'
import { SectionHeader } from '../../ui/SectionHeader/SectionHeader'
import { MediaCard, type MediaCardStatus } from '../../ui/MediaCard/MediaCard'
import { fichaItemAnchorId } from '../../ui/MediaCard/anchor'
import { ImageLightbox } from '../../ui/ImageLightbox/ImageLightbox'
import { ConfirmDialog } from '../../ui/ConfirmDialog/ConfirmDialog'
import { Button } from '../../ui/Button/Button'
import { ImageUploader } from '../../ui/ImageUploader/ImageUploader'
import type { UploaderPreviewState } from '../../ui/ImageUploader/ImageUploader'
import { TextArea } from '../../ui/Input/TextArea'
import { ToggleChip } from '../../ui/ToggleChip/ToggleChip'
import {
    ALLOWED_TYPES_LABEL,
    MAX_UPLOAD_LABEL,
    uploadImageFile,
    validateUploadFile,
} from '../../../services/upload.service'
import { renderPdfFirstPage } from '../../../utils/pdfPreview'

const ACCEPTED_MIME = 'image/jpeg,image/png,image/webp,application/pdf'

const MAX_NOMBRE = 300

export interface ExamItem {
    locked?: boolean
    documentUrl?: string
    id: string
    title: string
    imageSrc?: string
    imageResourceId?: string
    attachmentType?: 'image' | 'pdf'
    replacesId?: string
    status?: MediaCardStatus
}

function tieneAdjunto(item: ExamItem | null): boolean {
    return Boolean(item && (item.imageSrc || item.imageResourceId || item.documentUrl))
}

interface ExamsSectionProps {
    uploadPacienteId?: string
    allowReplacement?: boolean
    title?: string
    items: ExamItem[]
    onRemove?: (id: string) => void
    onAdd?: (item: ExamItem) => void
    readOnly?: boolean
    highlightedItemId?: string
    isOpen?: boolean
    onToggle?: () => void
    className?: string
    id?: string
}

interface ExamFormState {
    step:          1 | 2 | 3
    nombre:        string
    cambiaExistente: boolean | null
    replacesId:    string | null
    imagePreview:  string | null
    pdfPreview:    string | null
    imageFile:     File | null
    imagenBase64:  string | null
    nombreArchivo: string
    fileSizeBytes: number
    fileKind:      'image' | 'pdf'
    previewState:  UploaderPreviewState
    isUploading:   boolean
    uploadError:   string | null
    fileError:     string | null
    error:         string | null
}

const INITIAL_EXAM_FORM: ExamFormState = {
    step:          1,
    nombre:        '',
    cambiaExistente: null,
    replacesId:    null,
    imagePreview:  null,
    pdfPreview:    null,
    imageFile:     null,
    imagenBase64:  null,
    nombreArchivo: '',
    fileSizeBytes: 0,
    fileKind:      'image',
    previewState:  'idle',
    isUploading:   false,
    uploadError:   null,
    fileError:     null,
    error:         null,
}

const SIN_ARCHIVO = {
    imagePreview:  null,
    pdfPreview:    null,
    imageFile:     null,
    imagenBase64:  null,
    nombreArchivo: '',
    fileSizeBytes: 0,
    fileKind:      'image',
    previewState:  'idle',
    uploadError:   null,
} satisfies Partial<ExamFormState>

const examsIcon = (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M7 3H15L19 7V21H7V3Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M15 3V7H19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M9 12H15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        />
        <path
            d="M9 16H13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        />
    </svg>
)

export function ExamsSection({
    title = 'Estudios de Gabinete Indicados',
    items,
    onRemove,
    onAdd,
    readOnly = false,
    uploadPacienteId,
    allowReplacement = false,
    highlightedItemId,
    isOpen,
    onToggle,
    className,
    id,
}: ExamsSectionProps) {
    const [isOpenState, setIsOpenState] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<ExamItem | null>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [isFormPreviewOpen, setIsFormPreviewOpen] = useState(false)
    const [examForm, setExamForm] = useState<ExamFormState>(INITIAL_EXAM_FORM)
    const [itemAEliminar, setItemAEliminar] = useState<ExamItem | null>(null)
    const previewToken = useRef(0)
    const isExpanded = isOpen ?? isOpenState
    const handleToggle = onToggle ?? (() => setIsOpenState((prev) => !prev))

    const replacedIds = new Set(items.map((item) => item.replacesId).filter(Boolean))
    const statusOf = (item: ExamItem): MediaCardStatus =>
        item.status === 'replaced' || replacedIds.has(item.id) ? 'replaced' : 'active'
    const isPdfLike = (item: ExamItem) => {
        if (item.attachmentType === 'pdf') return true
        const url = item.documentUrl?.split('?')[0]?.toLowerCase()
        return Boolean(url?.endsWith('.pdf'))
    }
    const attachmentIcon = (
        <div className={styles.fileIcon} aria-hidden="true">
            <span>PDF</span>
        </div>
    )
    const ordered = [...items].sort((a, b) =>
        Number(statusOf(a) === 'replaced') - Number(statusOf(b) === 'replaced'))
    const replaceables = items.filter((item) => item.locked && statusOf(item) === 'active')
    const asksReplacement = allowReplacement && replaceables.length > 0
    const totalSteps = asksReplacement ? 3 : 2
    const formPreviewSrc = examForm.imagePreview ?? examForm.pdfPreview

    const openAddModal = () => {
        setExamForm(INITIAL_EXAM_FORM)
        setIsModalOpen(true)
    }

    const handleExamImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return

        const token = ++previewToken.current
        const vigente = () => previewToken.current === token

        const invalido = validateUploadFile(file, 'exam')
        if (invalido) {
            setExamForm((prev) => ({ ...prev, ...SIN_ARCHIVO, fileError: invalido }))
            return
        }

        const isPdf = file.type === 'application/pdf'
        setExamForm((prev) => ({
            ...prev,
            imageFile:     file,
            imagePreview:  null,
            pdfPreview:    null,
            imagenBase64:  null,
            nombreArchivo: file.name,
            fileSizeBytes: file.size,
            fileKind:      isPdf ? 'pdf' : 'image',
            previewState:  'loading',
            fileError:     null,
            uploadError:   null,
        }))

        if (isPdf) {
            renderPdfFirstPage(file)
                .then((dataUrl) => {
                    if (!vigente()) return
                    setExamForm((prev) => ({ ...prev, pdfPreview: dataUrl, previewState: 'ready' }))
                })
                .catch(() => {
                    if (!vigente()) return
                    setExamForm((prev) => ({ ...prev, previewState: 'unavailable' }))
                })
            return
        }

        const reader = new FileReader()
        reader.onload = (ev) => {
            if (!vigente()) return
            const base64 = ev.target?.result as string
            setExamForm((prev) => ({
                ...prev,
                imagePreview: base64,
                imagenBase64: base64,
                previewState: 'ready',
            }))
        }
        reader.onerror = () => {
            if (!vigente()) return
            setExamForm((prev) => ({ ...prev, previewState: 'unavailable' }))
        }
        reader.readAsDataURL(file)
    }

    const handleClearFile = () => {
        previewToken.current += 1
        setExamForm((prev) => ({ ...prev, ...SIN_ARCHIVO, fileError: null }))
    }

    const setCambiaExistente = (value: boolean) => {
        setExamForm((prev) => ({
            ...prev,
            cambiaExistente: prev.cambiaExistente === value ? null : value,
            replacesId: value ? prev.replacesId : null,
            error: null,
        }))
    }

    const goToStep = (step: ExamFormState['step']) => {
        setExamForm((prev) => ({ ...prev, step, error: null }))
    }

    const nombreValido = () => {
        if (examForm.nombre.trim().length >= 2) return true
        setExamForm((prev) => ({ ...prev, error: 'El nombre debe tener al menos 2 caracteres' }))
        return false
    }

    const goToReplacement = () => {
        if (nombreValido()) goToStep(3)
    }

    const handleAddExam = () => {
        if (!nombreValido()) return
        if (asksReplacement) {
            if (examForm.cambiaExistente == null) {
                setExamForm((prev) => ({ ...prev, error: 'Indique si este examen cambia alguno existente' }))
                return
            }
            if (examForm.cambiaExistente && !examForm.replacesId) {
                setExamForm((prev) => ({ ...prev, error: 'Seleccione cuál examen cambia' }))
                return
            }
        }

        const doAdd = async () => {
            let imageResourceId: string | undefined
            if (examForm.imageFile) {
                setExamForm((prev: ExamFormState) => ({ ...prev, isUploading: true, uploadError: null }))
                try {
                    imageResourceId = await uploadImageFile(examForm.imageFile as File, 'exam', uploadPacienteId)
                } catch (err) {
                    setExamForm((prev: ExamFormState) => ({
                        ...prev,
                        isUploading: false,
                        uploadError: err instanceof Error
                            ? err.message
                            : 'No se pudo subir el archivo. Intente de nuevo.',
                    }))
                    return
                }
            }

            const newItem: ExamItem = {
                id:             uuidv4(),
                title:          examForm.nombre.trim(),
                imageSrc:       examForm.imagePreview ?? undefined,
                imageResourceId,
                attachmentType: examForm.imageFile?.type === 'application/pdf' ? 'pdf' : examForm.imageFile ? 'image' : undefined,
                replacesId:     examForm.replacesId ?? undefined,
            }
            onAdd?.(newItem)
            toast.success(examForm.imageFile ? 'Examen agregado y archivo subido' : 'Examen agregado')
            setIsModalOpen(false)
            setExamForm(INITIAL_EXAM_FORM)
        }
        void doAdd()
    }

    const openDetail = (item: ExamItem) => {
        setSelectedItem(item)
        setIsDetailOpen(true)
    }

    const closeDetail = () => {
        setIsDetailOpen(false)
        setIsPreviewOpen(false)
    }

    return (
        <div id={id} className={[styles.card, className ?? ''].filter(Boolean).join(' ')}>
            <SectionHeader
                title={title}
                icon={examsIcon}
                isOpen={isExpanded}
                onToggle={handleToggle}
                embedded
            />

            {isExpanded && (
                <div className={styles.body}>
                    <div className={styles.list}>
                        {ordered.map((item) => (
                            <MediaCard
                                key={item.id}
                                id={fichaItemAnchorId(item.id)}
                                highlighted={item.id === highlightedItemId}
                                title={item.title}
                                imageSrc={item.imageSrc}
                                status={statusOf(item)}
                                leftSlot={isPdfLike(item) ? attachmentIcon : undefined}
                                onRemove={!readOnly && !item.locked && onRemove ? () => setItemAEliminar(item) : undefined}
                                onCardClick={() => openDetail(item)}
                            />
                        ))}

                        {readOnly && items.length === 0 && (
                            <span className={styles.emptyText}>
                                No se indicaron estudios de gabinete.
                            </span>
                        )}
                    </div>

                    {!readOnly && (
                        <Button
                            variant="primary"
                            fullWidth
                            onClick={openAddModal}
                        >
                            + Agregar examen sugerido
                        </Button>
                    )}
                </div>
            )}

            {isModalOpen && !readOnly && (
                <div className={styles.modalOverlay} role="dialog" aria-modal="true">
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <span className={styles.modalTitle}>Agregar Examen Sugerido</span>
                            <button
                                type="button"
                                className={styles.modalClose}
                                onClick={() => setIsModalOpen(false)}
                                aria-label="Cerrar"
                            >
                                <span aria-hidden="true">×</span>
                            </button>
                        </div>

                        <div className={styles.stepIndicator}>
                            {Array.from({ length: totalSteps }, (_, index) => index + 1).map((step) => (
                                <span
                                    key={step}
                                    className={[
                                        styles.stepDot,
                                        examForm.step === step ? styles.stepDotCurrent : '',
                                        examForm.step > step ? styles.stepDotDone : '',
                                    ].filter(Boolean).join(' ')}
                                />
                            ))}
                            <span className={styles.stepLabel}>Paso {examForm.step} de {totalSteps}</span>
                        </div>

                        {examForm.step === 1 && (
                            <div className={styles.modalBody}>
                                <span className={styles.stepBodyLabel}>
                                    Suba una foto o el archivo del examen (opcional)
                                </span>
                                <ImageUploader
                                    label={examForm.nombreArchivo ? 'Cambiar archivo' : 'Archivo (opcional)'}
                                    text={examForm.nombreArchivo ? 'Otro archivo' : 'Elegir archivo'}
                                    hint={`${ALLOWED_TYPES_LABEL.exam} de hasta ${MAX_UPLOAD_LABEL}`}
                                    accept={ACCEPTED_MIME}
                                    onChange={handleExamImageChange}
                                    fileName={examForm.nombreArchivo || undefined}
                                    fileSizeBytes={examForm.fileSizeBytes}
                                    fileKind={examForm.fileKind}
                                    previewSrc={formPreviewSrc ?? undefined}
                                    previewState={examForm.previewState}
                                    uploadState={examForm.isUploading ? 'uploading' : 'idle'}
                                    error={examForm.fileError}
                                    onClear={handleClearFile}
                                    onPreviewExpand={() => setIsFormPreviewOpen(true)}
                                    disabled={examForm.isUploading}
                                />
                            </div>
                        )}

                        {examForm.step === 2 && (
                            <div className={styles.modalBody}>
                                <span className={styles.stepBodyLabel}>
                                    Escriba el nombre del examen indicado
                                </span>
                                <TextArea
                                    label="Nombre del examen *"
                                    placeholder="Ej: Cariotipo, Ecocardiograma..."
                                    value={examForm.nombre}
                                    maxLength={MAX_NOMBRE}
                                    allowLineBreaks={false}
                                    onChange={(e) =>
                                        setExamForm((prev) => ({ ...prev, nombre: e.target.value, error: null }))
                                    }
                                    error={examForm.error ?? undefined}
                                />
                                {examForm.uploadError && (
                                    <span className={styles.fieldError} role="alert">
                                        {examForm.uploadError}
                                    </span>
                                )}
                            </div>
                        )}

                        {examForm.step === 3 && (
                            <div className={styles.modalBody}>
                                <div className={styles.replacementBlock}>
                                    <span className={styles.replacementLabel}>
                                        ¿Este examen cambia alguno existente?
                                    </span>
                                    <div className={styles.binaryGroup}>
                                        <ToggleChip
                                            selected={examForm.cambiaExistente === true}
                                            onClick={() => setCambiaExistente(true)}
                                        >
                                            Sí
                                        </ToggleChip>
                                        <ToggleChip
                                            selected={examForm.cambiaExistente === false}
                                            onClick={() => setCambiaExistente(false)}
                                        >
                                            No
                                        </ToggleChip>
                                    </div>

                                    {examForm.cambiaExistente && (
                                        <>
                                            <span className={styles.replacementLabel}>¿Cuál reemplaza?</span>
                                            <div className={styles.replacementChips}>
                                                {replaceables.map((item) => (
                                                    <ToggleChip
                                                        key={item.id}
                                                        selected={examForm.replacesId === item.id}
                                                        onClick={() => setExamForm((prev) => ({
                                                            ...prev,
                                                            replacesId: prev.replacesId === item.id ? null : item.id,
                                                            error: null,
                                                        }))}
                                                    >
                                                        {item.title}
                                                    </ToggleChip>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                                {examForm.error && (
                                    <span className={styles.fieldError} role="alert">
                                        {examForm.error}
                                    </span>
                                )}
                                {examForm.uploadError && (
                                    <span className={styles.fieldError} role="alert">
                                        {examForm.uploadError}
                                    </span>
                                )}
                            </div>
                        )}

                        <div className={styles.modalFooter}>
                            {examForm.step === 1 && (
                                <>
                                    <Button variant="ghost" fullWidth onClick={() => setIsModalOpen(false)}>
                                        Cancelar
                                    </Button>
                                    <Button variant="primary" fullWidth onClick={() => goToStep(2)}>
                                        Siguiente
                                    </Button>
                                </>
                            )}
                            {examForm.step === 2 && (
                                <>
                                    <Button variant="ghost" fullWidth disabled={examForm.isUploading} onClick={() => goToStep(1)}>
                                        Atrás
                                    </Button>
                                    {asksReplacement ? (
                                        <Button variant="primary" fullWidth onClick={goToReplacement}>
                                            Siguiente
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="primary"
                                            fullWidth
                                            isLoading={examForm.isUploading}
                                            onClick={handleAddExam}
                                        >
                                            Agregar
                                        </Button>
                                    )}
                                </>
                            )}
                            {examForm.step === 3 && (
                                <>
                                    <Button variant="ghost" fullWidth disabled={examForm.isUploading} onClick={() => goToStep(2)}>
                                        Atrás
                                    </Button>
                                    <Button
                                        variant="primary"
                                        fullWidth
                                        isLoading={examForm.isUploading}
                                        onClick={handleAddExam}
                                    >
                                        Agregar
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isDetailOpen && selectedItem && (
                <div className={styles.modalOverlay} role="dialog" aria-modal="true">
                    <div className={styles.detailModal}>
                        <div className={styles.modalHeader}>
                            <span className={styles.modalTitle}>Detalle del Examen</span>
                            <button
                                type="button"
                                className={styles.modalClose}
                                onClick={closeDetail}
                                aria-label="Cerrar"
                            >
                                <span aria-hidden="true">×</span>
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            {selectedItem.imageSrc ? (
                                <div className={styles.detailImageWrapper}>
                                    <img
                                        src={selectedItem.imageSrc}
                                        alt={selectedItem.title}
                                        className={styles.detailImage}
                                    />
                                    <button
                                        type="button"
                                        className={styles.previewButton}
                                        onClick={() => setIsPreviewOpen(true)}
                                        aria-label="Ver imagen completa"
                                    >
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M4 7C4 5.89543 4.89543 5 6 5H18C19.1046 5 20 5.89543 20 7V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V7Z"
                                                stroke="currentColor"
                                                strokeWidth="1.6"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                            <path
                                                d="M12 9V15"
                                                stroke="currentColor"
                                                strokeWidth="1.6"
                                                strokeLinecap="round"
                                            />
                                            <path
                                                d="M9 12H15"
                                                stroke="currentColor"
                                                strokeWidth="1.6"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            ) : isPdfLike(selectedItem) && selectedItem.documentUrl ? (
                                <a
                                    className={styles.detailFilePanel}
                                    href={selectedItem.documentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {attachmentIcon}
                                    <span className={styles.detailFileText}>Archivo adjunto</span>
                                    <ExternalLink className={styles.detailFileActionIcon} size={22} aria-hidden="true" />
                                </a>
                            ) : isPdfLike(selectedItem) && selectedItem.imageResourceId ? (
                                <div className={styles.detailFilePanel}>
                                    {attachmentIcon}
                                    <span className={styles.detailFileText}>Archivo adjunto</span>
                                    <ExternalLink className={styles.detailFileActionIcon} size={22} aria-hidden="true" />
                                </div>
                            ) : null}

                            <div className={styles.detailBlock}>
                                <span className={styles.detailLabel}>Descripcion del examen</span>
                                <span className={styles.detailText}>{selectedItem.title}</span>
                            </div>
                        </div>

                        <div className={styles.detailFooter}>
                            <Button variant="primary" fullWidth onClick={closeDetail}>
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <ImageLightbox
                isOpen={isFormPreviewOpen && isModalOpen && Boolean(formPreviewSrc)}
                onClose={() => setIsFormPreviewOpen(false)}
                src={formPreviewSrc ?? ''}
                alt={`Vista previa de ${examForm.nombreArchivo || 'el archivo'}`}
            />

            <ImageLightbox
                isOpen={isPreviewOpen && Boolean(selectedItem?.imageSrc)}
                onClose={() => setIsPreviewOpen(false)}
                src={selectedItem?.imageSrc ?? ''}
                alt={selectedItem?.title ?? ''}
            />

            <ConfirmDialog
                isOpen={itemAEliminar !== null}
                title="¿Eliminar este examen?"
                message={
                    <>
                        «{itemAEliminar?.title}» se eliminará
                        {tieneAdjunto(itemAEliminar) ? ' junto con su archivo adjunto' : ''}.
                        Esta acción no se puede deshacer.
                    </>
                }
                confirmLabel="Sí, eliminar"
                tone="destructive"
                onCancel={() => setItemAEliminar(null)}
                onConfirm={() => {
                    if (itemAEliminar) onRemove?.(itemAEliminar.id)
                    setItemAEliminar(null)
                }}
            />
        </div>
    )
}

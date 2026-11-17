/** Zona de carga de un archivo con miniatura, nombre, peso y estado de subida. */

import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Camera, FolderOpen } from 'lucide-react'
import styles from './ImageUploader.module.css'
import { formatFileSize } from '../../../utils/formatFileSize'

export type UploaderPreviewState = 'idle' | 'loading' | 'ready' | 'unavailable'

export type UploaderUploadState = 'idle' | 'uploading' | 'uploaded'

interface ImageUploaderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string
    text?: string
    hint?: string
    fileName?: string
    fileSizeBytes?: number
    fileKind?: 'image' | 'pdf'
    previewSrc?: string
    previewState?: UploaderPreviewState
    uploadState?: UploaderUploadState
    error?: string | null
    onClear?: () => void
    onPreviewExpand?: () => void
    showCamera?: boolean
    cameraAccept?: string
    cameraText?: string
}

function estadoDelArchivo(
    previewState: UploaderPreviewState,
    uploadState: UploaderUploadState,
): { texto: string; tono: 'progreso' | 'listo' | 'aviso' } {
    if (uploadState === 'uploading') return { texto: 'Subiendo archivo...', tono: 'progreso' }
    if (uploadState === 'uploaded') return { texto: 'Archivo subido', tono: 'listo' }
    if (previewState === 'loading') return { texto: 'Generando vista previa...', tono: 'progreso' }
    if (previewState === 'unavailable') return { texto: 'Archivo listo, sin vista previa', tono: 'aviso' }
    return { texto: 'Archivo listo para subir', tono: 'listo' }
}

export function PreviewExpandButton({ onClick, className }: { onClick: () => void; className?: string }) {
    return (
        <button
            type="button"
            className={[styles.expandButton, className ?? ''].filter(Boolean).join(' ')}
            onClick={onClick}
            aria-label="Ver imagen completa"
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M4 7C4 5.89543 4.89543 5 6 5H18C19.1046 5 20 5.89543 20 7V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V7Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 9V15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M9 12H15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
        </button>
    )
}

export function ImageUploader({
    label = 'Foto',
    text = 'Elegir archivo',
    hint,
    fileName,
    fileSizeBytes,
    fileKind = 'image',
    previewSrc,
    previewState = 'idle',
    uploadState = 'idle',
    error,
    onClear,
    onPreviewExpand,
    showCamera = true,
    cameraAccept = 'image/*',
    cameraText = 'Tomar foto',
    accept,
    onChange,
    className,
    id,
    disabled,
    ...rest
}: ImageUploaderProps) {
    const inputId = id ?? `image-uploader-${label.toLowerCase().replace(/\s+/g, '-')}`
    const cameraId = `${inputId}-camara`
    const autoId = useId()
    const hintId = `${autoId}-hint`
    const errorId = `${autoId}-error`

    const hayArchivo = Boolean(fileName)
    const subiendo = uploadState === 'uploading'
    const estado = estadoDelArchivo(previewState, uploadState)
    const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')

    const dropzoneClasses = [
        styles.dropzone,
        disabled ? styles.disabled : '',
        error ? styles.dropzoneError : '',
        className ?? '',
    ].filter(Boolean).join(' ')

    return (
        <div className={styles.wrapper}>
            {label && <span className={styles.label}>{label}</span>}

            {hayArchivo && (
                <div className={styles.selection}>
                    <div className={styles.previewPanel}>
                        {previewState === 'loading' ? (
                            <span className={styles.spinner} aria-hidden="true" />
                        ) : previewSrc ? (
                            <img
                                src={previewSrc}
                                alt={`Vista previa de ${fileName}`}
                                className={styles.previewImage}
                            />
                        ) : (
                            <span className={styles.fileBadge} aria-hidden="true">
                                {fileKind === 'pdf' ? 'PDF' : 'IMG'}
                            </span>
                        )}
                        {previewState !== 'loading' && previewSrc && onPreviewExpand && (
                            <PreviewExpandButton onClick={onPreviewExpand} />
                        )}
                    </div>

                    <div className={styles.selectionRow}>
                        <div className={styles.selectionMeta}>
                            <span className={styles.fileName} title={fileName}>{fileName}</span>
                            <span className={styles.fileSize}>
                                {fileKind === 'pdf' ? 'PDF' : 'Imagen'}
                                {typeof fileSizeBytes === 'number' ? ` de ${formatFileSize(fileSizeBytes)}` : ''}
                            </span>
                            <span
                                className={`${styles.fileStatus} ${styles[estado.tono]}`}
                                role="status"
                                aria-live="polite"
                            >
                                {estado.texto}
                            </span>
                        </div>

                        {onClear && (
                            <button
                                type="button"
                                className={styles.clearButton}
                                onClick={onClear}
                                disabled={disabled || subiendo}
                                aria-label={`Quitar ${fileName}`}
                            >
                                <span aria-hidden="true">×</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className={styles.actions}>
                {showCamera && (
                    <>
                        <label htmlFor={cameraId} className={dropzoneClasses} aria-disabled={disabled}>
                            <Camera className={styles.actionIcon} size={20} aria-hidden="true" />
                            <span className={styles.text}>{cameraText}</span>
                        </label>
                        <input
                            id={cameraId}
                            type="file"
                            className={styles.input}
                            accept={cameraAccept}
                            capture="environment"
                            onChange={onChange}
                            disabled={disabled}
                            aria-describedby={describedBy || undefined}
                            aria-invalid={error ? true : undefined}
                        />
                    </>
                )}

                <label htmlFor={inputId} className={dropzoneClasses} aria-disabled={disabled}>
                    <FolderOpen className={styles.actionIcon} size={20} aria-hidden="true" />
                    <span className={styles.text}>{text}</span>
                </label>
                <input
                    id={inputId}
                    type="file"
                    className={styles.input}
                    accept={accept}
                    onChange={onChange}
                    disabled={disabled}
                    aria-describedby={describedBy || undefined}
                    aria-invalid={error ? true : undefined}
                    {...rest}
                />
            </div>

            {hint && <span id={hintId} className={styles.hint}>{hint}</span>}
            {error && (
                <span id={errorId} className={styles.error} role="alert">
                    {error}
                </span>
            )}
        </div>
    )
}

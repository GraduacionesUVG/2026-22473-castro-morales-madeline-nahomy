/** Servicio de subida de imágenes mediante URLs prefirmadas. */

import { apiFetch } from './api.client'
import { formatFileSize } from '../utils/formatFileSize'

export type UploadCategory = 'profile' | 'exam'

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
export const MAX_UPLOAD_LABEL = '10 MB'

export const ALLOWED_TYPES: Record<UploadCategory, ReadonlySet<string>> = {
    profile: new Set(['image/jpeg', 'image/png', 'image/webp']),
    exam: new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
}

export const ALLOWED_TYPES_LABEL: Record<UploadCategory, string> = {
    profile: 'JPG, PNG o WebP',
    exam: 'JPG, PNG, WebP o PDF',
}

export function validateUploadFile(file: File, category: UploadCategory): string | null {
    if (!ALLOWED_TYPES[category].has(file.type)) {
        return `Solo se aceptan ${ALLOWED_TYPES_LABEL[category]}`
    }
    if (file.size <= 0) {
        return 'El archivo está vacío'
    }
    if (file.size > MAX_UPLOAD_BYTES) {
        return `El archivo pesa ${formatFileSize(file.size)} y el máximo es ${MAX_UPLOAD_LABEL}`
    }
    return null
}

interface PresignedUrlData {
    presignedUrl: string
    documentId:   string
    objectKey:    string
    headers?:     Record<string, string>
}

interface PresignedUrlApiResponse {
    success: boolean
    data:    PresignedUrlData
}

async function requestPresignedUrl(file: File, category: UploadCategory, pacienteId?: string): Promise<PresignedUrlData> {
    const path = pacienteId ? `/api/v1/pacientes/${encodeURIComponent(pacienteId)}/uploads/presigned-url` : '/v1/uploads/presigned-url'
    const res = await apiFetch<PresignedUrlApiResponse>(path, {
        auth: pacienteId ? 'bearer' : 'session',
        sensitive: true,
        method: 'POST',
        body:   JSON.stringify({ category, contentType: file.type, sizeBytes: file.size }),
    })
    return res.data
}

function putToBucket(file: File, { presignedUrl, headers }: PresignedUrlData): Promise<Response> {
    return fetch(presignedUrl, {
        method:  'PUT',
        body:    file,
        headers: { ...headers, 'Content-Type': file.type || 'application/octet-stream' },
    })
}

export async function uploadImageFile(file: File, category: UploadCategory, pacienteId?: string): Promise<string> {
    const invalido = validateUploadFile(file, category)
    if (invalido) {
        throw new Error(invalido)
    }

    let signed = await requestPresignedUrl(file, category, pacienteId)
    let uploadRes = await putToBucket(file, signed)

    if (uploadRes.status === 403) {
        signed = await requestPresignedUrl(file, category, pacienteId)
        uploadRes = await putToBucket(file, signed)
    }

    if (!uploadRes.ok) {
        throw new Error(`Error al subir imagen al bucket: HTTP ${uploadRes.status}`)
    }

    return signed.objectKey
}

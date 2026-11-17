/** Historias de Storybook de la zona de carga de archivos e imágenes. */

import type { Meta, StoryObj } from '@storybook/react-vite'
import { ImageUploader } from './ImageUploader'

const meta: Meta<typeof ImageUploader> = {
    title: 'UI/ImageUploader',
    component: ImageUploader,
    tags: ['autodocs'],
    parameters: {
        viewport: { defaultViewport: 'mobile1' },
    },
    args: {
        onClear: () => {},
    },
}

export default meta
type Story = StoryObj<typeof ImageUploader>

const paginaRasterizada = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160">
        <rect width="120" height="160" fill="#ffffff"/>
        <rect x="14" y="16" width="64" height="7" fill="#003E69"/>
        <rect x="14" y="34" width="92" height="3" fill="#A1A1A1"/>
        <rect x="14" y="43" width="92" height="3" fill="#A1A1A1"/>
        <rect x="14" y="52" width="70" height="3" fill="#A1A1A1"/>
        <rect x="14" y="70" width="92" height="3" fill="#A1A1A1"/>
        <rect x="14" y="79" width="84" height="3" fill="#A1A1A1"/>
        <rect x="14" y="100" width="46" height="5" fill="#45779E"/>
    </svg>`,
)}`

const fotoDeHallazgo = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
        <rect width="120" height="120" fill="#AED3F2"/>
        <circle cx="60" cy="48" r="22" fill="#6794BA"/>
        <path d="M14 108 L48 66 L74 96 L92 78 L110 108 Z" fill="#45779E"/>
    </svg>`,
)}`

const DE_GABINETE = {
    label: 'Archivo (opcional)',
    accept: 'image/jpeg,image/png,image/webp,application/pdf',
    hint: 'JPG, PNG, WebP o PDF de hasta 10 MB',
}

export const Default: Story = {
    args: {
        label: 'Foto',
        text: 'Elegir imagen',
        accept: 'image/*',
        onClear: undefined,
    },
}

export const Disabled: Story = {
    args: {
        label: 'Foto',
        text: 'Elegir imagen',
        accept: 'image/*',
        disabled: true,
        onClear: undefined,
    },
}

export const ConAyuda: Story = {
    args: {
        ...DE_GABINETE,
        text: 'Elegir archivo',
        onClear: undefined,
    },
}

export const SinCamara: Story = {
    args: {
        ...DE_GABINETE,
        text: 'Elegir archivo',
        showCamera: false,
        onClear: undefined,
    },
}

export const ConImagenSeleccionada: Story = {
    args: {
        ...DE_GABINETE,
        text: 'Otro archivo',
        fileName: 'ecocardiograma.jpg',
        fileSizeBytes: 842_000,
        fileKind: 'image',
        previewSrc: fotoDeHallazgo,
        previewState: 'ready',
    },
}

export const PdfRenderizando: Story = {
    args: {
        ...DE_GABINETE,
        text: 'Otro archivo',
        fileName: 'informe-cariotipo.pdf',
        fileSizeBytes: 1_468_000,
        fileKind: 'pdf',
        previewState: 'loading',
    },
}

export const PdfConPreview: Story = {
    args: {
        ...DE_GABINETE,
        text: 'Otro archivo',
        fileName: 'informe-cariotipo.pdf',
        fileSizeBytes: 1_468_000,
        fileKind: 'pdf',
        previewSrc: paginaRasterizada,
        previewState: 'ready',
    },
}

export const PdfSinPreview: Story = {
    args: {
        ...DE_GABINETE,
        text: 'Otro archivo',
        fileName: 'estudio-protegido.pdf',
        fileSizeBytes: 3_100_000,
        fileKind: 'pdf',
        previewState: 'unavailable',
    },
}

export const ArchivoDemasiadoGrande: Story = {
    args: {
        ...DE_GABINETE,
        text: 'Elegir archivo',
        error: 'El archivo pesa 14.2 MB y el máximo es 10 MB',
        onClear: undefined,
    },
}

export const TipoNoPermitido: Story = {
    args: {
        ...DE_GABINETE,
        text: 'Elegir archivo',
        error: 'Solo se aceptan JPG, PNG, WebP o PDF',
        onClear: undefined,
    },
}

export const Subiendo: Story = {
    args: {
        ...DE_GABINETE,
        text: 'Otro archivo',
        fileName: 'informe-cariotipo.pdf',
        fileSizeBytes: 1_468_000,
        fileKind: 'pdf',
        previewSrc: paginaRasterizada,
        previewState: 'ready',
        uploadState: 'uploading',
        disabled: true,
    },
}

export const Subido: Story = {
    args: {
        ...DE_GABINETE,
        text: 'Otro archivo',
        fileName: 'informe-cariotipo.pdf',
        fileSizeBytes: 1_468_000,
        fileKind: 'pdf',
        previewSrc: paginaRasterizada,
        previewState: 'ready',
        uploadState: 'uploaded',
    },
}

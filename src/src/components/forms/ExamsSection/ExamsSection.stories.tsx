/** Historias de Storybook de la sección Estudios de Gabinete Indicados de la ficha clínica. */

import { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test'
import { ExamsSection, type ExamItem } from './ExamsSection'
import { TOASTER_PROPS } from '../../../config/toast'
import { crearArchivoPdfDePrueba, crearArchivoPesado } from '../../../utils/pdfPreview.mock'

const meta: Meta<typeof ExamsSection> = {
    title: 'forms/ExamsSection',
    component: ExamsSection,
    tags: ['autodocs'],
    parameters: {
        viewport: { defaultViewport: 'mobile1' },
    },
}

export default meta
type Story = StoryObj<typeof ExamsSection>

const initialItems: ExamItem[] = [
    {
        id: 'exam-1',
        title: 'Cariotipo (analisis cromosomico)',
    },
]

export const Default: Story = {
    render: () => {
        const [items, setItems] = useState(initialItems)

        const handleRemove = (id: string) => {
            setItems((prev) => prev.filter((item) => item.id !== id))
        }

        return (
            <ExamsSection
                title="Estudios de Gabinete Indicados"
                items={items}
                onRemove={handleRemove}
            />
        )
    },
}

const storedExams: ExamItem[] = [
    { id: 'exam-1', title: 'Cariotipo (analisis cromosomico)', locked: true },
    { id: 'exam-2', title: 'Ecocardiograma', locked: true },
    { id: 'exam-3', title: 'Radiografia sustituida', locked: true, status: 'replaced' },
]

export const FichaRegistrada: Story = {
    args: { items: storedExams, readOnly: true },
}

export const Adenda: Story = {
    render: () => {
        const [items, setItems] = useState<ExamItem[]>(storedExams)
        return (
            <ExamsSection
                items={items}
                allowReplacement
                onAdd={(item) => setItems((prev) => [...prev, item])}
                onRemove={(id) => setItems((prev) => prev.filter((item) => item.locked || item.id !== id))}
            />
        )
    },
}

const BUCKET_SIMULADO = 'https://bucket.demo/estudio'

function ConSubidaSimulada({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const original = window.fetch
        window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
            if (url.includes('/uploads/presigned-url')) {
                return new Response(JSON.stringify({
                    success: true,
                    data: {
                        presignedUrl: BUCKET_SIMULADO,
                        documentId: 'documento-demo',
                        objectKey: `uploads/estudio-${Date.now()}`,
                        headers: {},
                    },
                }), { status: 200, headers: { 'Content-Type': 'application/json' } })
            }
            if (url.startsWith(BUCKET_SIMULADO)) return new Response(null, { status: 200 })
            return original(input, init)
        }
        return () => { window.fetch = original }
    }, [])
    return <>{children}</>
}

function CargaDeArchivosDemo() {
    const [items, setItems] = useState<ExamItem[]>([])
    return (
        <ConSubidaSimulada>
            <ExamsSection
                items={items}
                onAdd={(item) => setItems((prev) => [...prev, item])}
                onRemove={(id) => setItems((prev) => prev.filter((item) => item.id !== id))}
            />
            <Toaster {...TOASTER_PROPS} />
        </ConSubidaSimulada>
    )
}

function elegirArchivo(canvasElement: HTMLElement, file: File) {
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]')
    if (!input) throw new Error('No se encontro el input de archivo')
    const datos = new DataTransfer()
    datos.items.add(file)
    fireEvent.change(input, { target: { files: datos.files } })
}

async function abrirModal(canvasElement: HTMLElement) {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /Agregar examen sugerido/ }))
    return canvas
}

export const SubirArchivo: Story = {
    render: () => <CargaDeArchivosDemo />,
    play: async ({ canvasElement }) => {
        await abrirModal(canvasElement)
    },
}

export const PdfConVistaPrevia: Story = {
    render: () => <CargaDeArchivosDemo />,
    play: async ({ canvasElement }) => {
        const canvas = await abrirModal(canvasElement)

        elegirArchivo(canvasElement, crearArchivoPdfDePrueba())

        await expect(canvas.getByText('informe-cariotipo.pdf')).toBeInTheDocument()
        await waitFor(
            () => expect(canvas.getByAltText('Vista previa de informe-cariotipo.pdf')).toBeInTheDocument(),
            { timeout: 20000 },
        )
        await expect(canvas.getByText('Archivo listo para subir')).toBeInTheDocument()
        await expect(canvas.getByRole('button', { name: 'Ver imagen completa' })).toBeInTheDocument()
    },
}

export const ArchivoDemasiadoGrande: Story = {
    render: () => <CargaDeArchivosDemo />,
    play: async ({ canvasElement }) => {
        const canvas = await abrirModal(canvasElement)

        elegirArchivo(canvasElement, crearArchivoPesado('estudio-pesado.pdf', 'application/pdf', 11 * 1024 * 1024))

        const aviso = await canvas.findByRole('alert')
        await expect(aviso).toHaveTextContent('El archivo pesa 11.0 MB y el máximo es 10 MB')
        await expect(canvas.queryByText('estudio-pesado.pdf')).not.toBeInTheDocument()
    },
}

export const TipoNoPermitido: Story = {
    render: () => <CargaDeArchivosDemo />,
    play: async ({ canvasElement }) => {
        const canvas = await abrirModal(canvasElement)

        elegirArchivo(canvasElement, new File(['notas'], 'resultados.txt', { type: 'text/plain' }))

        const avisos = await canvas.findAllByRole('alert')
        await expect(avisos).toHaveLength(1)
        await expect(avisos[0]).toHaveTextContent('Solo se aceptan JPG, PNG, WebP o PDF')
        await expect(canvas.getByText('Paso 1 de 2')).toBeInTheDocument()
        await expect(canvas.queryByLabelText(/Nombre del examen/)).not.toBeInTheDocument()
    },
}

/** Generación de la miniatura de la primera página de un PDF. */

import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

type PdfjsModule = typeof import('pdfjs-dist')

let pdfjsPromise: Promise<PdfjsModule> | null = null

function loadPdfjs(): Promise<PdfjsModule> {
    pdfjsPromise ??= import('pdfjs-dist').then((pdfjs) => {
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
        return pdfjs
    })
    return pdfjsPromise
}

export async function renderPdfFirstPage(file: File, maxWidth = 640): Promise<string> {
    const pdfjs = await loadPdfjs()
    const data = await file.arrayBuffer()

    const loadingTask = pdfjs.getDocument({
        data,
        useWasm: false,
        useSystemFonts: true,
    })

    const pdf = await loadingTask.promise
    try {
        if (pdf.numPages < 1) {
            throw new Error('El PDF no tiene páginas')
        }
        const page = await pdf.getPage(1)
        const base = page.getViewport({ scale: 1 })
        const viewport = page.getViewport({ scale: Math.min(maxWidth / base.width, 2) })

        const canvas = document.createElement('canvas')
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        const context = canvas.getContext('2d')
        if (!context) {
            throw new Error('El navegador no permitió dibujar la vista previa')
        }
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, canvas.width, canvas.height)

        await page.render({ canvas, viewport }).promise
        return canvas.toDataURL('image/png')
    } finally {
        void loadingTask.destroy()
    }
}

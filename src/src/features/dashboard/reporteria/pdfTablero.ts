/** Generación del PDF del tablero de reportería abierto. */

import type { AgentTableBlock } from '../../../services/reporting.service'
import { columnasVisibles, formatearCelda, formatearEncabezado } from './chat'
import { distribuirFilas, esTabla, nombreArchivoPdf, NOMBRE_DASHBOARD, type DashboardId, type Tablero } from './tablero'

export interface PdfTablero {
    elemento: HTMLElement
    dashboard: DashboardId
    tablero: Tablero
}

const ATRIBUTO_KPIS = 'data-pdf-kpis'
const ATRIBUTO_TARJETA = 'data-pdf-tarjeta'
const ATRIBUTO_OMITIR = 'data-pdf-omitir'
const SELECTOR_TOOLTIP = '.recharts-tooltip-wrapper, .recharts-tooltip-cursor, .recharts-active-dot'

const PAGINA = { ancho: 210, alto: 297 }
const MARGEN = 15
const PIE = 16
const ANCHO = PAGINA.ancho - 2 * MARGEN
const HUECO = 6
const MITAD = (ANCHO - HUECO) / 2
const ALTO_MAXIMO_KPIS = 60
const ALTO_MAXIMO_TARJETA = 115

type Rgb = [number, number, number]
const PRIMARIO: Rgb = [0, 62, 105]
const GRIS: Rgb = [110, 110, 110]
const TEXTO: Rgb = [30, 30, 30]

interface Captura {
    url: string
    ancho: number
    alto: number
}

export async function descargarPdfTablero({ elemento, dashboard, tablero }: PdfTablero, ahora = new Date()) {
    const [{ jsPDF }, { autoTable }, { toJpeg }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
        import('html-to-image'),
    ])

    await esperarGraficasQuietas(elemento)

    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
    let y = MARGEN

    const reservar = (alto: number) => {
        if (y + alto > PAGINA.alto - PIE) {
            doc.addPage()
            y = MARGEN
        }
    }

    const escribir = (contenido: string, tamano: number, estilo: 'bold' | 'normal', color: Rgb) => {
        doc.setFont('helvetica', estilo)
        doc.setFontSize(tamano)
        doc.setTextColor(...color)
        const lineas = doc.splitTextToSize(texto(contenido), ANCHO) as string[]
        const altoLinea = tamano * 0.45
        reservar(lineas.length * altoLinea)
        doc.text(lineas, MARGEN, y + altoLinea * 0.8)
        y += lineas.length * altoLinea
    }

    const capturar = async (nodo: HTMLElement): Promise<Captura> => {
        const tooltips = [...nodo.querySelectorAll<HTMLElement | SVGElement>(SELECTOR_TOOLTIP)]
        const antes = tooltips.map((tooltip) => tooltip.style.visibility)
        tooltips.forEach((tooltip) => { tooltip.style.visibility = 'hidden' })
        try {
            const url = await toJpeg(nodo, {
                quality: 0.9,
                pixelRatio: 2,
                backgroundColor: '#ffffff',
                skipFonts: true,
                filter: (hijo) => !(hijo instanceof Element && hijo.hasAttribute(ATRIBUTO_OMITIR)),
            })
            return { url, ancho: nodo.offsetWidth, alto: nodo.offsetHeight }
        } finally {
            tooltips.forEach((tooltip, i) => { tooltip.style.visibility = antes[i] })
        }
    }

    escribir('Reportería CONGENIA', 16, 'bold', PRIMARIO)
    y += 1
    escribir(NOMBRE_DASHBOARD[dashboard], 12, 'bold', PRIMARIO)
    y += 1
    escribir(`Generado el ${formatearMomento(ahora)}`, 9, 'normal', GRIS)
    y += HUECO

    const kpis = elemento.querySelector<HTMLElement>(`[${ATRIBUTO_KPIS}]`)
    if (kpis) {
        const captura = await capturar(kpis)
        const medida = ajustar(captura, ANCHO, ALTO_MAXIMO_KPIS)
        reservar(medida.alto)
        doc.addImage(captura.url, 'JPEG', MARGEN, y, medida.ancho, medida.alto)
        y += medida.alto + HUECO
    }

    const { aLoAncho } = distribuirFilas(tablero)
    let fila: Captura[] = []
    const cerrarFila = () => {
        if (fila.length === 0) return
        const medidas = fila.map((captura) => ajustar(captura, MITAD, ALTO_MAXIMO_TARJETA))
        reservar(Math.max(...medidas.map((medida) => medida.alto)))
        fila.forEach((captura, i) => {
            doc.addImage(captura.url, 'JPEG', MARGEN + i * (MITAD + HUECO), y, medidas[i].ancho, medidas[i].alto)
        })
        y += Math.max(...medidas.map((medida) => medida.alto)) + HUECO
        fila = []
    }

    const dibujarTabla = (bloque: AgentTableBlock) => {
        reservar(30)
        escribir(bloque.title, 11, 'bold', PRIMARIO)
        y += 2

        const columnas = columnasVisibles(bloque.rows, bloque.columns)
        autoTable(doc, {
            startY: y,
            margin: { top: MARGEN, right: MARGEN, bottom: PIE, left: MARGEN },
            head: [columnas.map((columna) => texto(formatearEncabezado(columna)))],
            body: bloque.rows.map((filaDatos) => columnas.map((columna) => texto(formatearCelda(filaDatos[columna], columna)))),
            styles: { font: 'helvetica', fontSize: 8, cellPadding: 1.8, textColor: TEXTO },
            headStyles: { fillColor: PRIMARIO, textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [244, 247, 250] },
            columnStyles: Object.fromEntries(columnas.map((columna, i) => [
                i,
                bloque.rows.some((filaDatos) => typeof filaDatos[columna] === 'number') ? { halign: 'right' as const } : {},
            ])),
        })
        const final = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY
        y = (final ?? y) + HUECO
    }

    for (const id of tablero.orden) {
        const widget = tablero.widgets[id]
        if (widget && esTabla(widget.bloque)) {
            cerrarFila()
            dibujarTabla(widget.bloque)
            continue
        }
        const nodo = elemento.querySelector<HTMLElement>(`[${ATRIBUTO_TARJETA}="${CSS.escape(id)}"]`)
        if (!nodo) continue
        const captura = await capturar(nodo)
        if (aLoAncho.has(id)) {
            cerrarFila()
            const medida = ajustar(captura, ANCHO, ALTO_MAXIMO_TARJETA)
            reservar(medida.alto)
            doc.addImage(captura.url, 'JPEG', MARGEN, y, medida.ancho, medida.alto)
            y += medida.alto + HUECO
            continue
        }
        fila.push(captura)
        if (fila.length === 2) cerrarFila()
    }
    cerrarFila()

    const paginas = doc.getNumberOfPages()
    for (let pagina = 1; pagina <= paginas; pagina++) {
        doc.setPage(pagina)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(...GRIS)
        const base = PAGINA.alto - 8
        doc.text(texto('Datos agregados, sin información de pacientes.'), MARGEN, base)
        doc.text(`Página ${pagina} de ${paginas}`, PAGINA.ancho - MARGEN, base, { align: 'right' })
    }

    doc.save(nombreArchivoPdf(dashboard, ahora))
}

async function esperarGraficasQuietas(elemento: HTMLElement, maximoMs = 2400) {
    const dibujo = () => [...elemento.querySelectorAll('.recharts-surface')].map((svg) => svg.innerHTML).join('')
    let antes = dibujo()
    for (let esperado = 0; esperado < maximoMs; esperado += 150) {
        await new Promise((resolver) => setTimeout(resolver, 150))
        const ahora = dibujo()
        if (ahora === antes) return
        antes = ahora
    }
}

function ajustar({ ancho, alto }: Captura, anchoMaximo: number, altoMaximo: number) {
    if (ancho <= 0 || alto <= 0) return { ancho: anchoMaximo, alto: 0 }
    const escala = Math.min(anchoMaximo / ancho, altoMaximo / alto)
    return { ancho: ancho * escala, alto: alto * escala }
}

function formatearMomento(fecha: Date): string {
    return new Intl.DateTimeFormat('es-GT', { dateStyle: 'long', timeStyle: 'short' }).format(fecha)
}

function texto(valor: string): string {
    return valor.replace(/[\u00a0\u2007\u202f]/g, ' ')
}

/** PDF de prueba generado en memoria para Storybook y pruebas. */

function escaparTextoPdf(texto: string): string {
    return texto.replace(/[\\()]/g, (caracter) => `\\${caracter}`)
}

const LINEAS_POR_DEFECTO = [
    'Laboratorio Clinico',
    'Estudio: Cariotipo en sangre',
    'Paciente: caso de demostracion',
    'Resultado: 46,XY normal',
]

export function crearPdfDePrueba(lineas: string[] = LINEAS_POR_DEFECTO): string {
    const texto = lineas
        .map((linea) => `(${escaparTextoPdf(linea)}) Tj T*`)
        .join('\n')
    const contenido = `BT\n/F1 15 Tf\n24 TL\n40 250 Td\n${texto}\nET`

    const cuerpos = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 420 300] /Contents 4 0 R'
            + ' /Resources << /Font << /F1 5 0 R >> >> >>',
        `<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream`,
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ]

    let pdf = '%PDF-1.4\n'
    const offsets: number[] = []
    cuerpos.forEach((cuerpo, i) => {
        offsets.push(pdf.length)
        pdf += `${i + 1} 0 obj\n${cuerpo}\nendobj\n`
    })

    const inicioXref = pdf.length
    pdf += `xref\n0 ${cuerpos.length + 1}\n0000000000 65535 f \n`
    pdf += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')
    pdf += `trailer\n<< /Size ${cuerpos.length + 1} /Root 1 0 R >>\n`
    pdf += `startxref\n${inicioXref}\n%%EOF\n`
    return pdf
}

export function crearArchivoPdfDePrueba(
    nombre = 'informe-cariotipo.pdf',
    lineas?: string[],
): File {
    return new File([crearPdfDePrueba(lineas)], nombre, { type: 'application/pdf' })
}

export function crearArchivoPesado(nombre: string, tipo: string, bytes: number): File {
    return new File([new Uint8Array(bytes)], nombre, { type: tipo })
}

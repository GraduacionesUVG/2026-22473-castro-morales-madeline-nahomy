/** Interpretación segura del formato básico en las respuestas del agente, sin HTML. */

export type EtiquetaPermitida = 'p' | 'br' | 'strong' | 'em' | 'ul' | 'ol' | 'li' | 'code'

export interface NodoElemento {
    etiqueta: EtiquetaPermitida
    hijos: Nodo[]
}

export type Nodo = string | NodoElemento

export interface TextoInterpretado {
    formato: boolean
    nodos: Nodo[]
}

const ALIAS: Record<string, EtiquetaPermitida> = {
    p: 'p',
    br: 'br',
    strong: 'strong',
    b: 'strong',
    em: 'em',
    i: 'em',
    ul: 'ul',
    ol: 'ol',
    li: 'li',
    code: 'code',
}

const SIN_CONTENIDO = new Set([
    'script', 'style', 'iframe', 'object', 'embed', 'template', 'svg', 'math',
    'noscript', 'textarea', 'title', 'head', 'select', 'xmp', 'noembed', 'noframes',
])

const EN_LINEA = new Set<EtiquetaPermitida>(['strong', 'em', 'code'])

const PROFUNDIDAD_MAXIMA = 8

const ETIQUETA = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([^<>]*)>/g

const RESTO_DE_ETIQUETA = /^(\s+[a-zA-Z_:][-\w:.]*\s*=\s*("[^"]*"|'[^']*'|[^\s"'=<>`]+))*\s*\/?$/

const COMENTARIO = /<!--[\s\S]*?(-->|$)/g

const ENTIDADES: Record<string, string> = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
}

interface Contenedor {
    etiqueta: EtiquetaPermitida | 'raiz'
    hijos: Nodo[]
}

export function interpretarTexto(entrada: string): TextoInterpretado {
    const texto = entrada.replace(COMENTARIO, '')
    if (!tieneEtiquetas(texto)) return { formato: false, nodos: [texto] }

    const raiz: Contenedor = { etiqueta: 'raiz', hijos: [] }
    const pila: Contenedor[] = [raiz]
    const actual = () => pila[pila.length - 1]

    const abrir = (etiqueta: EtiquetaPermitida) => {
        const nodo: NodoElemento = { etiqueta, hijos: [] }
        actual().hijos.push(nodo)
        pila.push(nodo)
    }
    const cerrarHasta = (cumple: (contenedor: Contenedor) => boolean) => {
        const indice = pila.findLastIndex(cumple)
        if (indice < 0) return false
        pila.length = indice + 1
        return true
    }
    const cerrar = (etiqueta: EtiquetaPermitida) => {
        const indice = pila.findLastIndex((contenedor) => contenedor.etiqueta === etiqueta)
        if (indice > 0) pila.length = indice
    }
    const asegurarFueraDeLista = () => {
        const { etiqueta } = actual()
        if (etiqueta === 'ul' || etiqueta === 'ol') abrir('li')
    }

    const agregarTexto = (crudo: string) => {
        const limpio = decodificar(crudo).replace(/\s+/g, ' ')
        if (!limpio) return
        const { etiqueta } = actual()
        if ((etiqueta === 'ul' || etiqueta === 'ol') && !limpio.trim()) return
        asegurarFueraDeLista()
        const hijos = actual().hijos
        const ultimo = hijos[hijos.length - 1]
        if (typeof ultimo === 'string') hijos[hijos.length - 1] = (ultimo + limpio).replace(/\s{2,}/g, ' ')
        else hijos.push(limpio)
    }

    let cursor = 0
    ETIQUETA.lastIndex = 0
    for (let match = ETIQUETA.exec(texto); match; match = ETIQUETA.exec(texto)) {
        const [completa, barra, nombreCrudo, resto] = match
        if (!RESTO_DE_ETIQUETA.test(resto)) continue

        agregarTexto(texto.slice(cursor, match.index))
        cursor = match.index + completa.length

        const nombre = nombreCrudo.toLowerCase()
        const cierre = barra === '/'

        if (!cierre && SIN_CONTENIDO.has(nombre)) {
            const fin = texto.toLowerCase().indexOf(`</${nombre}`, cursor)
            const finEtiqueta = fin < 0 ? -1 : texto.indexOf('>', fin)
            cursor = finEtiqueta < 0 ? texto.length : finEtiqueta + 1
            ETIQUETA.lastIndex = cursor
            continue
        }

        const etiqueta = ALIAS[nombre]
        if (!etiqueta || resto.replace('/', '').trim()) continue
        if (actual().etiqueta === 'code' && !(cierre && etiqueta === 'code')) continue

        if (cierre) {
            cerrar(etiqueta)
            continue
        }
        if (pila.length > PROFUNDIDAD_MAXIMA) continue

        if (etiqueta === 'br') {
            if (actual().etiqueta === 'ul' || actual().etiqueta === 'ol') continue
            actual().hijos.push({ etiqueta: 'br', hijos: [] })
        } else if (etiqueta === 'li') {
            if (cerrarHasta((contenedor) => contenedor.etiqueta === 'ul' || contenedor.etiqueta === 'ol')) abrir('li')
        } else if (etiqueta === 'p' || etiqueta === 'ul' || etiqueta === 'ol') {
            cerrarHasta((contenedor) => contenedor.etiqueta === 'raiz' || contenedor.etiqueta === 'li')
            abrir(etiqueta)
        } else if (EN_LINEA.has(etiqueta)) {
            asegurarFueraDeLista()
            abrir(etiqueta)
        }
    }
    agregarTexto(texto.slice(cursor))

    return { formato: true, nodos: recortar(raiz.hijos) }
}

function tieneEtiquetas(texto: string): boolean {
    ETIQUETA.lastIndex = 0
    for (let match = ETIQUETA.exec(texto); match; match = ETIQUETA.exec(texto)) {
        if (RESTO_DE_ETIQUETA.test(match[3])) return true
    }
    return false
}

function recortar(nodos: Nodo[], bloque = true): Nodo[] {
    const procesados = nodos.map((nodo) => typeof nodo === 'string' || nodo.etiqueta === 'code'
        ? nodo
        : { ...nodo, hijos: recortar(nodo.hijos, !EN_LINEA.has(nodo.etiqueta)) })
    if (!bloque) return procesados
    const limpios = procesados.filter((nodo, i) => typeof nodo !== 'string' || nodo.trim() !== ''
        || !(esBloqueOBorde(procesados[i - 1]) || esBloqueOBorde(procesados[i + 1])))
    const primero = limpios[0]
    if (typeof primero === 'string') limpios[0] = primero.trimStart()
    const ultimo = limpios[limpios.length - 1]
    if (typeof ultimo === 'string') limpios[limpios.length - 1] = ultimo.trimEnd()
    return limpios.filter((nodo) => nodo !== '')
}

function esBloqueOBorde(nodo: Nodo | undefined): boolean {
    return nodo === undefined || (typeof nodo !== 'string' && !EN_LINEA.has(nodo.etiqueta) && nodo.etiqueta !== 'br')
}

function decodificar(texto: string): string {
    return texto.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entidad, cuerpo: string) => {
        if (cuerpo[0] !== '#') return ENTIDADES[cuerpo.toLowerCase()] ?? entidad
        const codigo = cuerpo[1].toLowerCase() === 'x' ? parseInt(cuerpo.slice(2), 16) : parseInt(cuerpo.slice(1), 10)
        const imprimible = codigo >= 0x20 && codigo <= 0x10ffff && !(codigo >= 0x7f && codigo < 0xa0)
            && !(codigo >= 0xd800 && codigo <= 0xdfff)
        return imprimible ? String.fromCodePoint(codigo) : entidad
    })
}

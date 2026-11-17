/** Texto con formato básico de una respuesta del agente. */

import { createElement, useMemo, type ReactNode } from 'react'
import { interpretarTexto, type Nodo } from './textoSeguro'
import styles from './AgentChatPanel.module.css'

export function TextoAgente({ texto }: { texto: string }) {
    const { formato, nodos } = useMemo(() => interpretarTexto(texto), [texto])

    if (!formato) return <p>{nodos.join('')}</p>
    return <div className={styles.textoFormato}>{pintar(nodos)}</div>
}

function pintar(nodos: Nodo[]): ReactNode[] {
    return nodos.map((nodo, indice) => typeof nodo === 'string'
        ? nodo
        : nodo.etiqueta === 'br'
            ? <br key={indice} />
            : createElement(nodo.etiqueta, { key: indice }, ...pintar(nodo.hijos)))
}

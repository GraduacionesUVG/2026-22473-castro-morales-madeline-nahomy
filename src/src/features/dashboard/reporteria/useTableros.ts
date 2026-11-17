/** Hook de los tableros de reportería guardados en el navegador. */

import { useEffect, useState } from 'react'
import { leerArchivoTableros, serializarTableros, tablerosIniciales, type Tableros } from './tablero'

function cargar(clave: string): Tableros {
    try {
        const guardado = window.localStorage.getItem(clave)
        return guardado ? leerArchivoTableros(guardado) : tablerosIniciales()
    } catch {
        return tablerosIniciales()
    }
}

export function useTableros(clave: string) {
    const [tableros, setTableros] = useState<Tableros>(() => cargar(clave))

    useEffect(() => {
        try {
            window.localStorage.setItem(clave, serializarTableros(tableros))
        } catch {}
    }, [clave, tableros])

    return [tableros, setTableros] as const
}

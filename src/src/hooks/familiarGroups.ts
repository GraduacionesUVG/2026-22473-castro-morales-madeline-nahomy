/** Agrupación del catálogo de familiares en núcleo, línea materna y línea paterna. */

import type { CatFamiliar } from '../services/catalog.service'
import type { FamiliarAfectadoGroup } from '../components/forms/DemographicDataView/DemographicDataView'
import type { DropdownOption } from '../components/ui/Dropdown/Dropdown'

type Lado = 'materno' | 'paterno' | null

export function ladoDelFamiliar(nombre: string): Lado {
    const n = nombre.toLowerCase()

    if (n.includes('matern')) return 'materno'
    if (n.includes('patern')) return 'paterno'
    if (/\bm\b/.test(n)) return 'materno'
    if (/\bp\b/.test(n)) return 'paterno'

    return null
}

export function groupFamiliares(familiares: CatFamiliar[]): FamiliarAfectadoGroup[] {
    const nucleo:   CatFamiliar[] = []
    const maternos: CatFamiliar[] = []
    const paternos: CatFamiliar[] = []

    for (const familiar of familiares) {
        const lado = ladoDelFamiliar(familiar.nombre)
        if (lado === 'materno') maternos.push(familiar)
        else if (lado === 'paterno') paternos.push(familiar)
        else nucleo.push(familiar)
    }

    const toOpts = (arr: CatFamiliar[]): DropdownOption[] =>
        arr.map((f) => ({ value: f.familiar_catalogo_id.toString(), label: f.nombre }))

    const groups: FamiliarAfectadoGroup[] = []
    if (nucleo.length > 0)   groups.push({ groupLabel: 'Núcleo familiar', options: toOpts(nucleo) })
    if (maternos.length > 0) groups.push({ groupLabel: 'Familia materna', options: toOpts(maternos) })
    if (paternos.length > 0) groups.push({ groupLabel: 'Familia paterna', options: toOpts(paternos) })

    return groups
}

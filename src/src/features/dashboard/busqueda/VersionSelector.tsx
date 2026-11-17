/** Selector de versiones de una ficha. */

import type { ChangeEvent } from 'react'
import { Dropdown } from '../../../components/ui/Dropdown/Dropdown'
import type { FichaSummary } from '../../../services/ficha.service'
import { etiquetaVersion } from './versiones'
import styles from './VersionSelector.module.css'

export interface VersionSelectorProps {
    versiones: FichaSummary[]
    fichaActivaId: string
    onSeleccionar: (fichaId: string) => void
    disabled?: boolean
}

export function VersionSelector({
    versiones,
    fichaActivaId,
    onSeleccionar,
    disabled = false,
}: VersionSelectorProps) {
    if (versiones.length < 2) return null

    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        if (event.target.value !== fichaActivaId) onSeleccionar(event.target.value)
    }

    return (
        <div className={styles.wrapper}>
            <Dropdown
                id="version-ficha"
                label="Versión de la ficha"
                options={versiones.map((version) => ({
                    value: version.fichaId,
                    label: etiquetaVersion(version),
                }))}
                value={fichaActivaId}
                onChange={handleChange}
                disabled={disabled}
            />
        </div>
    )
}

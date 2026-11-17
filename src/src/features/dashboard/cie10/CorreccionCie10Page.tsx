/** Página de entrada de la corrección CIE-10 (/dashboard/cie10). */

import { usePageHeader } from '../layout/usePageHeader'
import { Cie10Lotes } from './Cie10Lotes'

export function CorreccionCie10Page() {
    usePageHeader('Corrección CIE-10')
    return <Cie10Lotes />
}

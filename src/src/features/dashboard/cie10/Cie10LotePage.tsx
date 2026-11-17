/** Página de un lote CIE-10 (/dashboard/cie10/:runId). */

import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ROUTES } from '../../../app/routes'
import { Cie10BatchReview } from './Cie10BatchReview'

export function Cie10LotePage() {
    const { runId = '' } = useParams()
    const navigate = useNavigate()

    const volver = useCallback((revisado: boolean) => {
        navigate(revisado ? `${ROUTES.dashboardCie10}?estado=revisados` : ROUTES.dashboardCie10)
    }, [navigate])

    return <Cie10BatchReview key={runId} runId={runId} onVolver={volver} />
}

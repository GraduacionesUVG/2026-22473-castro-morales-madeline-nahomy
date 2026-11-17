/** Vista de una ficha registrada con la opción de solicitar una adenda. */

import { useEffect, useState } from 'react'
import { RegistrationOrchestratorView } from '../../components/forms/RegistrationOrchestratorView/RegistrationOrchestratorView'
import { LoadingView } from '../../components/forms/LoadingView/LoadingView'
import { ErrorView } from '../../components/forms/ErrorView/ErrorView'
import { useCatalogs } from '../../hooks/useCatalogs'
import { crearRevision, getFicha, type FichaDetail } from '../../services/ficha.service'
import { buildRevisionPayload, fichaToView } from './ficha.mapper'
import { AVISO_REGISTRO_MANUAL, isProvisionalHistory } from '../ficha-provisional/provisional'
import type { HeaderNotice } from '../../components/forms/RegistrationOrchestratorView/RegistrationOrchestratorView'

const ADENDA_DISPONIBLE =
    'Esta ficha admite adendas. Para agregar signos de alerta, estudios u observaciones, pulse «Solicitar adenda» al final.'
const FICHA_REGISTRADA =
    'Este paciente ya tiene una ficha asignada.'
const ADENDA_PENDIENTE =
    'Hay una adenda pendiente de aprobación. Podrá solicitar más cambios cuando se resuelva.'

interface Props {
    fichaId: string
    mode?: 'view' | 'append'
    hasPendingRevision?: boolean
    onBack: () => void
    onLoaded?: (ficha: FichaDetail) => void
}

export function FichaRecord({ fichaId, mode = 'view', hasPendingRevision = false, onBack, onLoaded }: Props) {
    const [detail, setDetail] = useState<FichaDetail | null>(null)
    const [error, setError] = useState('')
    const catalogs = useCatalogs()
    useEffect(() => {
        let cancelled = false
        getFicha(fichaId).then((data) => {
            if (cancelled) return
            setDetail(data)
            onLoaded?.(data)
        }).catch((err: unknown) => {
            if (!cancelled) setError(err instanceof Error ? err.message : 'No se pudo cargar la ficha.')
        })
        return () => { cancelled = true }
    }, [fichaId, onLoaded])
    if (error || catalogs.error) return <ErrorView message={error || catalogs.error || ''} onRetry={onBack} retryLabel="Regresar" />
    if (!detail || detail.fichaId !== fichaId || catalogs.loading) return <LoadingView message="Abriendo ficha registrada" />
    const effectiveMode = mode === 'append' && detail.esVigente && ['COMPLETA', 'VALIDADA'].includes(detail.estadoFicha) ? 'append' : 'view'
    const avisoAdenda: HeaderNotice = hasPendingRevision ? { text: ADENDA_PENDIENTE, tone: 'pending' }
        : effectiveMode === 'append' ? { text: ADENDA_DISPONIBLE, tone: 'action' }
        : { text: FICHA_REGISTRADA }
    const headerNotices: HeaderNotice[] = isProvisionalHistory(detail.paciente?.historiaClinica)
        ? [{ text: AVISO_REGISTRO_MANUAL, tone: 'pending' }, avisoAdenda]
        : [avisoAdenda]
    return (
        <RegistrationOrchestratorView
            key={`${detail.fichaId}:${effectiveMode}`}
            {...fichaToView(detail)}
            mode={effectiveMode}
            headerNotices={headerNotices}
            initialOpenSection="appointment"
            uploadPacienteId={detail.pacienteId}
            referidoDeOptions={catalogs.referidoDeOptions}
            lugarDePartoOptions={catalogs.asistenciaPartoOptions}
            sexoOptions={catalogs.sexoOptions}
            familiarAfectadoGroups={catalogs.familiarGroups}
            regionDefs={catalogs.regionDefs}
            onBack={onBack}
            onRequestChanges={async (motivo, form) => { await crearRevision(detail.fichaId, buildRevisionPayload(motivo, form)) }}
        />
    )
}

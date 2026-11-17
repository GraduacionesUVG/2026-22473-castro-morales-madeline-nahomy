/** Visor de una ficha registrada en solo lectura. */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { TriangleAlert, Undo2 } from 'lucide-react'
import { RegistrationOrchestratorView } from '../../../components/forms/RegistrationOrchestratorView/RegistrationOrchestratorView'
import { Button } from '../../../components/ui/Button/Button'
import { usePageHeader } from '../layout/usePageHeader'
import { ROUTES } from '../../../app/routes'
import { getFichaById } from '../../../services/fichaSearch.service'
import { listFichasPaciente, type FichaSummary } from '../../../services/ficha.service'
import { ApiError } from '../../../services/api.client'
import { VersionSelector } from './VersionSelector'
import { versionesDelLinaje } from './versiones'
import type { FichaDetalle } from '../../../types/ficha-search'
import type { AlertSignItem } from '../../../components/forms/AlertSignsSection/AlertSignsSection'
import type { ExamItem } from '../../../components/forms/ExamsSection/ExamsSection'
import type { DropdownOption } from '../../../components/ui/Dropdown/Dropdown'
import type { MediaCardChip } from '../../../components/ui/MediaCard/MediaCard'
import styles from './FichaDetailPage.module.css'

type Estado =
    | { status: 'loading' }
    | { status: 'ready'; ficha: FichaDetalle }
    | { status: 'error'; message: string }

function mensajeDeError(error: unknown): string {
    if (error instanceof ApiError) {
        if (error.status === 404) return 'Esta ficha no existe o fue archivada.'
        if (error.status === 408) return 'La consulta tardó demasiado.'
        if (error.status === 0)   return 'No hay conexión con el servidor.'
        if (error.status === 401 || error.status === 403) {
            return 'Su sesión no tiene permiso para ver esta ficha.'
        }
    }
    return 'No se pudo cargar la ficha. Intente de nuevo en un momento.'
}

function opcionUnica(opcion: { value: string; label: string } | null): DropdownOption[] {
    return opcion ? [opcion] : []
}

function aAlertSignItems(ficha: FichaDetalle): AlertSignItem[] {
    return ficha.signosAlerta.map((signo) => {
        const chips: MediaCardChip[] = []
        if (signo.parteDelCuerpoLabel) chips.push(signo.parteDelCuerpoLabel)

        return {
            id: signo.id,
            title: signo.nombre,
            imageSrc: signo.imagenUrl,
            parteDelCuerpo: signo.parteDelCuerpo,
            chips,
        }
    })
}

function aExamItems(ficha: FichaDetalle): ExamItem[] {
    return ficha.examenesSugeridos.map((examen) => ({
        id: examen.id,
        title: examen.nombre,
        imageSrc: examen.imagenUrl,
        nombreArchivo: examen.nombreArchivo,
    }))
}

export function FichaDetailPage() {
    const { fichaId } = useParams<{ fichaId: string }>()

    if (!fichaId) return <FichaNoIndicada />

    return <FichaDetail key={fichaId} fichaId={fichaId} />
}

function FichaNoIndicada() {
    const navigate = useNavigate()
    usePageHeader('Registro del Paciente')

    return (
        <div className={styles.state} role="alert">
            <TriangleAlert size={40} className={styles.stateIcon} aria-hidden="true" />
            <span className={styles.stateTitle}>No se indicó qué ficha abrir</span>
            <div className={styles.stateActions}>
                <Button variant="primary" onClick={() => navigate(ROUTES.dashboardBusqueda)}>
                    Volver a la búsqueda
                </Button>
            </div>
        </div>
    )
}

function FichaDetail({ fichaId }: { fichaId: string }) {
    const navigate = useNavigate()

    const [fichaActivaId, setFichaActivaId] = useState(fichaId)

    const [estado, setEstado] = useState<Estado>({ status: 'loading' })
    const [intento, setIntento] = useState(0)

    const [versiones, setVersiones] = useState<FichaSummary[]>([])

    const [nombrePaciente, setNombrePaciente] = useState<string>()

    useEffect(() => {
        let vigente = true

        getFichaById(fichaActivaId).then(
            (ficha) => {
                if (!vigente) return
                setEstado({ status: 'ready', ficha })
                setNombrePaciente(ficha.nombrePaciente)
            },
            (error) => { if (vigente) setEstado({ status: 'error', message: mensajeDeError(error) }) },
        )

        return () => { vigente = false }
    }, [fichaActivaId, intento])

    const fichaCargada = estado.status === 'ready' ? estado.ficha : null
    const idTenant = fichaCargada?.idTenant
    const historiaClinica = fichaCargada?.historiaClinica

    const versionesPedidas = useRef(false)

    useEffect(() => {
        if (versionesPedidas.current) return
        if (idTenant === undefined || !historiaClinica) return

        versionesPedidas.current = true
        let vigente = true

        listFichasPaciente(String(idTenant), historiaClinica).then(
            (fichas) => { if (vigente) setVersiones(versionesDelLinaje(fichas, fichaId)) },
            () => {
            },
        )

        return () => { vigente = false }
    }, [fichaId, idTenant, historiaClinica])

    const volver = useCallback(() => navigate(ROUTES.dashboardBusqueda), [navigate])

    const reintentar = useCallback(() => {
        setEstado({ status: 'loading' })
        setIntento((n) => n + 1)
    }, [])

    const cambiarVersion = useCallback((id: string) => {
        setEstado({ status: 'loading' })
        setFichaActivaId(id)
    }, [])

    const botonRegresar = useMemo(() => (
        <button
            type="button"
            className={styles.backButton}
            onClick={volver}
            aria-label="Regresar a la búsqueda"
            title="Regresar a la búsqueda"
        >
            <Undo2 size={20} aria-hidden="true" />
        </button>
    ), [volver])

    usePageHeader('Registro para el Paciente:', nombrePaciente, botonRegresar)

    let contenido: ReactNode

    if (estado.status === 'loading') {
        contenido = (
            <div className={styles.sections} aria-busy="true" aria-label="Cargando la ficha">
                {Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className={styles.skeleton} />
                ))}
            </div>
        )
    } else if (estado.status === 'error') {
        contenido = (
            <div className={styles.state} role="alert">
                <TriangleAlert size={40} className={styles.stateIcon} aria-hidden="true" />
                <span className={styles.stateTitle}>No se pudo abrir la ficha</span>
                <p className={styles.stateText}>{estado.message}</p>
                <div className={styles.stateActions}>
                    <Button variant="ghost" onClick={reintentar}>Reintentar</Button>
                    <Button variant="primary" onClick={volver}>Volver a la búsqueda</Button>
                </div>
            </div>
        )
    } else {
        const { ficha } = estado

        contenido = (
            <RegistrationOrchestratorView
                key={ficha.fichaId}
                readOnly
                patientName={ficha.nombrePaciente}
                numeroExpediente={ficha.historiaClinica}
                fechaConsulta={ficha.datosConsulta.fechaConsulta}
                medicoConsulta={ficha.datosConsulta.medicoConsulta}
                especialidad={ficha.datosConsulta.especialidad}
                diagnosticos={ficha.datosConsulta.diagnosticos}
                referidoDeOptions={opcionUnica(ficha.datosConsulta.referidoDe)}
                lugarDePartoOptions={opcionUnica(ficha.datosConsulta.lugarDeParto)}
                sexoOptions={opcionUnica(ficha.datosConsulta.sexo ?? null)}
                initialReferidoDe={ficha.datosConsulta.referidoDe?.value ?? ''}
                initialLugarDeParto={ficha.datosConsulta.lugarDeParto?.value ?? ''}
                initialSexo={ficha.datosConsulta.sexo?.value ?? ''}
                initialFamiliaresAfectados={ficha.otrosDemograficos.familiaresAfectados}
                initialMenoresEnHogar={ficha.otrosDemograficos.menoresEnHogar}
                initialAdultosEnHogar={ficha.otrosDemograficos.adultosEnHogar}
                initialQuienAfectado={ficha.otrosDemograficos.quienAfectado}
                initialAfectadosComunidad={ficha.otrosDemograficos.afectadosComunidad}
                initialAlertSigns={aAlertSignItems(ficha)}
                initialExams={aExamItems(ficha)}
                initialObservaciones={(ficha.observaciones ?? []).map((observacion) => ({
                    id: observacion.id,
                    text: observacion.texto,
                    fecha: observacion.fecha,
                    locked: true,
                }))}
            />
        )
    }

    return (
        <>
            <VersionSelector
                versiones={versiones}
                fichaActivaId={fichaActivaId}
                onSeleccionar={cambiarVersion}
                disabled={estado.status === 'loading'}
            />
            {contenido}
        </>
    )
}

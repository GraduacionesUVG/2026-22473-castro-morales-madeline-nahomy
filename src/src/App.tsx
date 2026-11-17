/** Flujo de captura de la ficha clínica: sesión, búsqueda de paciente, registro manual y formulario. */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { RegistrationOrchestratorView } from './components/forms/RegistrationOrchestratorView/RegistrationOrchestratorView'
import { PatientSearchView } from './components/forms/PatientSearchView/PatientSearchView'
import { ManualRegistrationView } from './components/forms/ManualRegistrationView/ManualRegistrationView'
import { ErrorView } from './components/forms/ErrorView/ErrorView'
import { LoadingView } from './components/forms/LoadingView/LoadingView'
import {
    activateSession,
    createManualSession,
    createProvisionalSession,
    type SessionActivateResponse,
} from './services/session.service'
import { setSessionToken, ApiError } from './services/api.client'
import { getExistingUser, getValidAccessToken, requireAuthenticatedUser } from './services/auth.service'
import { useAuth } from './features/auth/useAuth'
import { accessFromMe, can, tenantsWith } from './features/auth/permissions'
import { loadMe } from './features/auth/me'
import { displayNameOf } from './features/auth/profile'
import { ALLOW_DEV_SESSION, DEV_FICHA_SESSION } from './features/auth/devSession'
import { ROUTES } from './app/routes'
import { registerPatient } from './services/patient.service'
import { searchPatient, PatientSearchError } from './services/patientSearch.service'
import { useCatalogs } from './hooks/useCatalogs'
import { TOASTER_PROPS } from './config/toast'
import type { FichaClinica } from './types/ficha'
import type { Paciente } from './types/patient'
import type { FichaFormState } from './features/ficha-clinica/fichaClinica.mapper'
import { listFichasPaciente } from './services/ficha.service'
import type { FichaSummary, TenantOption } from './services/ficha.service'
import { FichaRecord } from './features/patient/FichaRecord'
import {
    AVISO_REGISTRO_MANUAL,
    isProvisionalHistory,
    manualRegistrationErrorMessage,
    type ManualRegistrationValues,
} from './features/ficha-provisional/provisional'

type View = 'search' | 'manual' | 'ficha' | 'error'

type SessionState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'ready'; data: SessionActivateResponse }
    | { status: 'error'; message: string }

type SubmitState =
    | { status: 'idle' }
    | { status: 'submitting' }
    | { status: 'success'; fichaId: string; savedAt: string }
    | { status: 'error'; message: string }

type AuthState =
    | { status: 'loading' }
    | { status: 'ready'; displayName: string; canOpenDashboard: boolean }
    | { status: 'not-required' }
    | { status: 'error'; message: string }

interface SessionHistoryState {
    congeniaSessionToken?: string
}

function readSessionToken(): string | null {
    const params = new URLSearchParams(window.location.search)
    const queryToken = params.get('sessionToken')
    if (queryToken) return queryToken

    const fragmentParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const fragmentToken = fragmentParams.get('sessionToken')
    if (fragmentToken) return fragmentToken

    const historyState = window.history.state as SessionHistoryState | null
    return historyState?.congeniaSessionToken ?? null
}

function initialSessionState(): SessionState {
    if (readSessionToken()) return { status: 'loading' }
    if (ALLOW_DEV_SESSION) {
        return { status: 'ready', data: DEV_FICHA_SESSION }
    }
    return { status: 'idle' }
}

function initialView(): View {
    return readSessionToken() ? 'ficha' : 'search'
}

function formatSelloDeTiempo(isoDelServidor?: string): string {
    const fecha = isoDelServidor ? new Date(isoDelServidor) : new Date()
    const valida = !Number.isNaN(fecha.getTime()) ? fecha : new Date()

    return (
        valida.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' }) +
        ' - ' +
        valida.toLocaleDateString('es-GT')
    )
}

function App() {
    const { logout } = useAuth()
    const navigate = useNavigate()

    const [view, setView]         = useState<View>(initialView)
    const [session, setSession]   = useState<SessionState>(initialSessionState)
    const [auth, setAuth] = useState<AuthState>(
        readSessionToken() || ALLOW_DEV_SESSION ? { status: 'not-required' } : { status: 'loading' },
    )
    const [medicoAutenticado, setMedicoAutenticado] = useState('')
    const [selloDeTiempo, setSelloDeTiempo] = useState('')
    const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' })
    const catalogs = useCatalogs()

    const [isSearching, setIsSearching]             = useState(false)
    const [searchErrorDetail, setSearchErrorDetail] = useState<string | undefined>(undefined)
    const [lastQuery, setLastQuery] = useState({ historiaClinica: '', idTenant: '' })
    const [paciente, setPaciente] = useState<Paciente | null>(null)
    const [tenantOptions, setTenantOptions] = useState<TenantOption[]>([])
    const [tenantId, setTenantId] = useState('')
    const [hasPendingRevision, setHasPendingRevision] = useState(false)
    const [selectedFicha, setSelectedFicha] = useState<{ id: string; mode: 'view' | 'append' } | null>(null)
    const [notFound, setNotFound] = useState<{ historiaClinica: string; tenantId: string } | null>(null)
    const [manualSubmitting, setManualSubmitting] = useState(false)
    const [manualError, setManualError] = useState<string | undefined>(undefined)

    useEffect(() => {
        const sessionToken = readSessionToken()
        if (!sessionToken) {
            requireAuthenticatedUser()
                .then(async (user) => {
                    const access = accessFromMe(await loadMe(user))
                    const options = tenantsWith(access, 'fichas.crear')
                    setTenantOptions(options)
                    setTenantId(options[0]?.id ?? '')
                    setMedicoAutenticado(displayNameOf(user))
                    setAuth({
                        status: 'ready',
                        displayName: displayNameOf(user),
                        canOpenDashboard: can(access, 'dashboard'),
                    })
                })
                .catch((err: unknown) => setAuth({
                    status: 'error',
                    message: err instanceof Error ? err.message : 'No se pudo iniciar sesión',
                }))
            return
        }

        void getExistingUser().then((user) => {
            if (user) setMedicoAutenticado(displayNameOf(user))
        })

        setSessionToken(sessionToken)

        window.history.replaceState(
            { ...(window.history.state ?? {}), congeniaSessionToken: sessionToken },
            '',
            window.location.pathname,
        )

        activateSession()
            .then((data) => setSession({ status: 'ready', data }))
            .catch((err: Error) =>
                setSession({ status: 'error', message: err.message ?? 'Error activando sesión' })
            )
    }, [])

    const abrirFichaRegistrada = (fichas: FichaSummary[]): boolean => {
        const vigente = fichas.find((ficha) => ficha.esVigente)
        const pending = fichas.some((ficha) => (ficha.estadoFicha ?? ficha.estado) === 'PENDIENTE')
        setHasPendingRevision(pending)
        if (vigente) {
            setSelectedFicha({ id: vigente.fichaId, mode: pending ? 'view' : 'append' })
            setSessionToken(null)
            setView('ficha')
            return true
        }
        if (fichas.some((ficha) => (ficha.estadoFicha ?? ficha.estado) !== 'BORRADOR')) {
            throw new Error('El paciente tiene fichas registradas pero ninguna vigente. Contacte a un administrador.')
        }
        return false
    }

    const abrirSesionNueva = async (sessionToken: string) => {
        setSessionToken(sessionToken)
        window.history.replaceState(
            { ...(window.history.state ?? {}), congeniaSessionToken: sessionToken },
            '',
            window.location.pathname,
        )
        const activated = await activateSession()
        setSession({ status: 'ready', data: activated })
    }

    const handleSearch = (historiaClinica: string, idTenant: string) => {
        if (isSearching) return

        setLastQuery({ historiaClinica, idTenant: String(idTenant) })
        setNotFound(null)
        setIsSearching(true)

        searchPatient({ historiaClinica, idTenant })
            .then(async (encontrado) => {
                setPaciente(encontrado)
                const fichas = await listFichasPaciente(String(encontrado.idTenant), encontrado.historiaClinica)
                if (abrirFichaRegistrada(fichas)) return
                setSelectedFicha(null)

                if (auth.status !== 'ready') {
                    throw new Error('La sesión de usuario no está disponible. Vuelva a iniciar sesión.')
                }

                setSession({ status: 'loading' })
                const accessToken = await getValidAccessToken()
                const created = await createManualSession(encontrado, accessToken)
                await abrirSesionNueva(created.sessionToken)
                setView('ficha')
            })
            .catch(async (err: unknown) => {
                if (err instanceof PatientSearchError && err.status === 404) {
                    try {
                        const fichas = await listFichasPaciente(String(idTenant), historiaClinica)
                        if (abrirFichaRegistrada(fichas)) return
                        setNotFound({ historiaClinica, tenantId: String(idTenant) })
                    } catch (listErr) {
                        setSearchErrorDetail(listErr instanceof Error ? listErr.message : undefined)
                        setView('error')
                    }
                    return
                }

                setSearchErrorDetail(err instanceof Error ? err.message : undefined)
                setView('error')
            })
            .finally(() => setIsSearching(false))
    }

    const handleStartManual = () => {
        if (!notFound) return
        setManualError(undefined)
        setView('manual')
    }

    const handleManualSubmit = async (values: ManualRegistrationValues) => {
        if (!notFound || manualSubmitting) return
        if (auth.status !== 'ready') {
            setManualError('La sesión de usuario no está disponible. Vuelva a iniciar sesión.')
            return
        }

        setManualSubmitting(true)
        setManualError(undefined)
        let sessionToken: string
        try {
            const accessToken = await getValidAccessToken()
            const created = await createProvisionalSession({
                historiaClinica: notFound.historiaClinica,
                tenantId: notFound.tenantId,
                nombre: values.nombre,
                fechaConsulta: values.fechaConsulta,
            }, accessToken)
            sessionToken = created.sessionToken
        } catch (err) {
            const message = err instanceof ApiError
                ? manualRegistrationErrorMessage(err.code) ?? err.message
                : 'No se pudo abrir la ficha. Intente de nuevo.'
            setManualError(message)
            setManualSubmitting(false)
            return
        }

        setPaciente(null)
        setSelectedFicha(null)
        setHasPendingRevision(false)
        setSession({ status: 'loading' })
        setView('ficha')
        try {
            await abrirSesionNueva(sessionToken)
            setNotFound(null)
        } catch (err) {
            setSession({ status: 'error', message: err instanceof Error ? err.message : 'Error activando sesión' })
        } finally {
            setManualSubmitting(false)
        }
    }

    const handleBackToSearch = () => {
        setSessionToken(null)

        const historyState = { ...(window.history.state ?? {}) } as SessionHistoryState
        delete historyState.congeniaSessionToken
        window.history.replaceState(
            historyState,
            '',
            window.location.pathname,
        )

        setSession(initialSessionState())
        setSubmitState({ status: 'idle' })
        setPaciente(null)
        setSelectedFicha(null)
        setHasPendingRevision(false)
        setSelloDeTiempo('')
        setNotFound(null)
        setManualError(undefined)
        setView('search')

        if (!ALLOW_DEV_SESSION && auth.status !== 'ready') {
            window.location.reload()
        }
    }

    const handleSaveDraft = (ficha: FichaClinica) => {
        void ficha
    }

    const handleFinalize = (_ficha: FichaClinica, formState: FichaFormState) => {
        if (submitState.status === 'submitting') return

        setSubmitState({ status: 'submitting' })

        registerPatient(formState)
            .then(({ fichaId, fechaHoraAceptacion }) => {
                const savedAt = formatSelloDeTiempo(fechaHoraAceptacion)
                setSelloDeTiempo(savedAt)
                setSubmitState({ status: 'success', fichaId, savedAt })
            })
            .catch((err: unknown) => {
                console.error('[CONGENIA] Falló el guardado de ficha', err)
                let message = 'Error al registrar la ficha'
                if (err instanceof ApiError) {
                    if (err.code === 'FICHA_VIGENTE_EXISTE') message = 'Este paciente ya tiene una ficha vigente. Vuelva a la búsqueda para abrirla.'
                    else if (err.status === 409) message = 'La sesión ya fue consumida - la ficha ya fue registrada.'
                    else if (err.status === 410) message = 'La sesión expiró - solicita un nuevo acceso al sistema.'
                    else message = err.message
                } else if (err instanceof Error && err.message) {
                    message = err.message
                }
                setSubmitState({ status: 'error', message })
            })
    }

    const irAlDashboard = auth.status === 'ready' && auth.canOpenDashboard
        ? () => { void navigate(ROUTES.dashboard) }
        : undefined

    const renderContent = () => {
        if (view === 'search') {
            if (auth.status === 'loading') {
                return <LoadingView message="Verificando acceso" />
            }

            if (auth.status === 'error') {
                return (
                    <ErrorView
                        title="No se pudo iniciar sesión"
                        message={auth.message}
                        onRetry={() => window.location.reload()}
                    />
                )
            }

            return (
                <PatientSearchView
                    onSearch={handleSearch}
                    isLoading={isSearching}
                    initialHistoriaClinica={lastQuery.historiaClinica}
                    tenantOptions={tenantOptions}
                    tenantId={tenantId}
                    onTenantIdChange={setTenantId}
                    authenticatedUser={auth.status === 'ready' ? auth.displayName : undefined}
                    onLogout={auth.status === 'ready' ? logout : undefined}
                    onGoToDashboard={irAlDashboard}
                    notFound={notFound}
                    onManualRegister={handleStartManual}
                    onNotFoundDismiss={() => setNotFound(null)}
                />
            )
        }

        if (view === 'manual' && notFound) {
            const tenantLabel = tenantOptions.find((option) => option.id === notFound.tenantId)?.label
                ?? notFound.tenantId
            return (
                <ManualRegistrationView
                    historiaClinica={notFound.historiaClinica}
                    tenantId={notFound.tenantId}
                    tenantLabel={tenantLabel}
                    onSubmit={(values) => { void handleManualSubmit(values) }}
                    onBack={() => setView('search')}
                    isSubmitting={manualSubmitting}
                    errorMessage={manualError}
                    authenticatedUser={auth.status === 'ready' ? auth.displayName : undefined}
                    onLogout={auth.status === 'ready' ? logout : undefined}
                    onGoToDashboard={irAlDashboard}
                />
            )
        }

        if (view === 'error') {
            return (
                <ErrorView
                    onRetry={() => setView('search')}
                    detail={searchErrorDetail}
                />
            )
        }

        if (session.status === 'error') {
            return (
                <ErrorView
                    title="No se pudo abrir la ficha"
                    message={session.message}
                    onRetry={handleBackToSearch}
                    retryLabel="Volver a la búsqueda"
                />
            )
        }

        if (selectedFicha) {
            return <FichaRecord
                key={`${selectedFicha.id}:${selectedFicha.mode}`}
                fichaId={selectedFicha.id}
                mode={selectedFicha.mode}
                hasPendingRevision={hasPendingRevision}
                onBack={handleBackToSearch} />
        }

        if (session.status === 'idle' || session.status === 'loading' || catalogs.loading) {
            return <LoadingView message="Abriendo la ficha" />
        }

        if (catalogs.error) {
            return (
                <ErrorView
                    title="No se pudieron cargar los catálogos"
                    detail={catalogs.error}
                    onRetry={() => window.location.reload()}
                />
            )
        }

        const s = session.data

        const medicoConsulta = medicoAutenticado || s.medico.nombre

        const submitResult =
            submitState.status === 'success'
                ? { ok: true as const, fichaId: submitState.fichaId, savedAt: submitState.savedAt }
                : submitState.status === 'error'
                ? { ok: false as const, errorMessage: submitState.message }
                : null

        const numeroExpediente = paciente?.historiaClinica ?? s.paciente.historiaClinica ?? s.paciente.externalId

        return (
            <RegistrationOrchestratorView
                patientName={paciente?.nombreCompleto ?? s.paciente.nombre}
                numeroExpediente={numeroExpediente}
                headerNotices={isProvisionalHistory(numeroExpediente)
                    ? [{ text: AVISO_REGISTRO_MANUAL, tone: 'pending' as const }]
                    : undefined}
                fechaConsulta={s.consulta.fechaConsulta}
                medicoConsulta={medicoConsulta}
                selloDeTiempo={selloDeTiempo}
                especialidad={s.medico.especialidad}
                diagnosticos={s.consulta.diagnosticoTexto}
                referidoDeOptions={catalogs.referidoDeOptions}
                lugarDePartoOptions={catalogs.asistenciaPartoOptions}
                sexoOptions={catalogs.sexoOptions}
                familiarAfectadoGroups={catalogs.familiarGroups}
                regionDefs={catalogs.regionDefs}
                initialAlertSigns={[]}
                initialExams={[]}
                onSaveDraft={handleSaveDraft}
                onFinalize={handleFinalize}
                onBack={handleBackToSearch}
                isSubmitting={submitState.status === 'submitting'}
                submitResult={submitResult}
            />
        )
    }

    return (
        <>
            {renderContent()}
            <Toaster {...TOASTER_PROPS} />
        </>
    )
}

export default App

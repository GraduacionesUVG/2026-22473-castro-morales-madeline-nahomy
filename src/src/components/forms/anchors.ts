/** Identificadores de ancla y etiquetas de las secciones de la ficha clínica. */

export type SectionKey = 'appointment' | 'demographic' | 'alerts' | 'exams' | 'observations' | 'consent'

export const fichaSectionAnchorId = (key: SectionKey) => `ficha-seccion-${key}`

export const SECTION_LABELS: Record<SectionKey, string> = {
    appointment: 'Datos de la Consulta',
    demographic: 'Otros Demográficos',
    alerts:      'Signos de Alerta',
    exams:       'Estudios de Gabinete',
    observations: 'Observaciones',
    consent:     'Consentimiento',
}

/** Contexto del encabezado del dashboard. */

import { createContext } from 'react'
import type { ReactNode } from 'react'

export interface PageHeader {
    title: string
    highlight?: string
    action?: ReactNode
}

export interface PageHeaderContextValue {
    header: PageHeader | null
    setHeader: (header: PageHeader | null) => void
}

export const PageHeaderContext = createContext<PageHeaderContextValue | null>(null)

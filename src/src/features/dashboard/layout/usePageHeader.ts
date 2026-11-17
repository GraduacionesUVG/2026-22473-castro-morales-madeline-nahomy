/** Hook para que una página fije el encabezado del dashboard. */

import { useContext, useEffect } from 'react'
import type { ReactNode } from 'react'
import { PageHeaderContext } from './PageHeaderContext'

export function usePageHeader(title: string, highlight?: string, action?: ReactNode): void {
    const context = useContext(PageHeaderContext)
    if (!context) {
        throw new Error('usePageHeader() requiere que el arbol este dentro de <DashboardLayout>')
    }

    const { setHeader } = context

    useEffect(() => {
        setHeader({ title, highlight, action })
        return () => setHeader(null)
    }, [setHeader, title, highlight, action])
}

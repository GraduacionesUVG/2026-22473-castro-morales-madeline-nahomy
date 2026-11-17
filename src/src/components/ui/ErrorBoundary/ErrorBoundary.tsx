/** Límite de errores que captura excepciones de render y muestra una vista alternativa. */

import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
    children: ReactNode
    fallback: (error: Error) => ReactNode
}

interface ErrorBoundaryState {
    error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { error: null }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { error }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error(
            '[CONGENIA] Error no controlado en el render:',
            error.message,
            info.componentStack,
        )
    }

    render() {
        const { error } = this.state
        if (error) return this.props.fallback(error)
        return this.props.children
    }
}

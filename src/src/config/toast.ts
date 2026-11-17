/** Configuración compartida de las notificaciones (Toaster). */

import type { ToasterProps } from 'react-hot-toast'

export const TOASTER_PROPS: ToasterProps = {
    position: 'bottom-center',
    toastOptions: {
        duration: 4000,
        style: {
            fontFamily:   'var(--font-family)',
            fontSize:     'var(--font-size-sm)',
            borderRadius: 'var(--radius)',
            background:   'var(--color-surface)',
            color:        'var(--color-black)',
            boxShadow:    '0 10px 30px rgba(0, 0, 0, 0.15)',
            maxWidth:     '90vw',
        },
        error: {
            style: { border: '1.5px solid var(--color-destructive)' },
            iconTheme: {
                primary:   'var(--color-destructive)',
                secondary: 'var(--color-white)',
            },
        },
        success: {
            style: { border: '1.5px solid var(--color-success)' },
            iconTheme: {
                primary:   'var(--color-success)',
                secondary: 'var(--color-white)',
            },
        },
    },
}

/** Historias de Storybook de los modales de exportar e importar el tablero de reportería. */

import type { Meta, StoryObj } from '@storybook/react-vite'
import { ExportarTableroModal } from './ExportarTableroModal'
import { ImportarTableroModal } from './ImportarTableroModal'

const meta: Meta = {
    title: 'Dashboard/TableroModales',
    parameters: { layout: 'fullscreen' },
}

export default meta

export const Exportar: StoryObj<typeof ExportarTableroModal> = {
    render: (args) => <ExportarTableroModal {...args} />,
    args: {
        isOpen: true,
        onClose: () => {},
        onDescargar: () => {},
        tarjetas: { produccion: 3, ficha: 1 },
    },
}

export const ExportarMovil: StoryObj<typeof ExportarTableroModal> = {
    ...Exportar,
    globals: { viewport: { value: 'mobile1' } },
}

export const Importar: StoryObj<typeof ImportarTableroModal> = {
    render: (args) => <ImportarTableroModal {...args} />,
    args: {
        isOpen: true,
        onClose: () => {},
        onImportar: () => {},
    },
}

export const ImportarMovil: StoryObj<typeof ImportarTableroModal> = {
    ...Importar,
    globals: { viewport: { value: 'mobile1' } },
}

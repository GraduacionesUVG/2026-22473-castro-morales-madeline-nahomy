/** Historias de Storybook de las acciones del tablero de reportería. */

import type { Meta, StoryObj } from '@storybook/react-vite'
import { HerramientasTablero } from './HerramientasTablero'

const meta: Meta<typeof HerramientasTablero> = {
    title: 'Dashboard/HerramientasTablero',
    component: HerramientasTablero,
    parameters: { layout: 'padded' },
    decorators: [(Story, { parameters }) => (
        <div style={{ containerType: 'inline-size', width: parameters.ancho ?? 720 }}>
            <Story />
        </div>
    )],
    args: {
        nombreTablero: 'Producción ambulatoria',
        tarjetasAgente: 3,
        pdfDisponible: true,
        generandoPdf: false,
        onExportar: () => {},
        onImportar: () => {},
        onDescargarPdf: () => {},
        onBorrar: () => {},
    },
}

export default meta
type Story = StoryObj<typeof HerramientasTablero>

export const Escritorio: Story = {}

export const SinTarjetas: Story = {
    args: { tarjetasAgente: 0 },
}

export const GenerandoPdf: Story = {
    args: { generandoPdf: true },
}

export const Cargando: Story = {
    args: { pdfDisponible: false },
}

export const Angosto: Story = {
    parameters: { ancho: 340 },
}

/** Historias de Storybook de el aviso informativo en línea. */

import type { Meta, StoryObj } from '@storybook/react-vite'
import { InlineNotice } from './InlineNotice'
import { AVISO_IMAGEN_MENOR, AVISO_SECCION_IRREVERSIBLE } from '../../forms/avisos'

const meta: Meta<typeof InlineNotice> = {
    title: 'UI/InlineNotice',
    component: InlineNotice,
    tags: ['autodocs'],
    parameters: {
        viewport: { defaultViewport: 'mobile1' },
    },
    decorators: [
        (Story) => (
            <div style={{ maxWidth: 360 }}>
                <Story />
            </div>
        ),
    ],
}

export default meta
type Story = StoryObj<typeof InlineNotice>

export const Irreversible: Story = {
    args: { children: AVISO_SECCION_IRREVERSIBLE },
}

export const Info: Story = {
    args: { children: 'Los datos de la consulta los envia el SADC.' },
}

export const Advertencia: Story = {
    args: { tone: 'warning', children: AVISO_IMAGEN_MENOR },
}

export const Peligro: Story = {
    args: {
        tone: 'danger',
        children: 'No tiene instituciones asignadas. Contacte al administrador.',
    },
}

export const TextoLargo: Story = {
    args: {
        children: 'Esta sección concentra los datos demográficos del núcleo familiar del paciente'
            + ' y de su comunidad. Revísala con calma antes de finalizar, porque una vez enviado'
            + ' el registro queda fijada y el flujo de adendas no admite correcciones sobre ella.',
    },
}

/** Gráfica de área con la serie mensual de registros. */

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { MonthlyItem } from '../../../services/reporting.service'
import { COLOR, EJE, EJE_NUMERICO, ESTILO_TOOLTIP, MARGEN } from './estiloGraficas'
import { formatearMes, formatearNumero } from './formato'
import styles from './ReporteriaView.module.css'

interface MonthlyChartProps {
    items: MonthlyItem[]
    serie: string
}

export function MonthlyChart({ items, serie }: MonthlyChartProps) {
    if (items.length === 0) {
        return <p className={styles.empty}>Sin datos para este periodo.</p>
    }

    return (
        <div className={styles.chart}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={items} margin={MARGEN}>
                    <defs>
                        <linearGradient id="reporteria-area" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={COLOR.area} stopOpacity={0.9} />
                            <stop offset="100%" stopColor={COLOR.area} stopOpacity={0.15} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid stroke={COLOR.cuadricula} vertical={false} />
                    <XAxis
                        dataKey="mes"
                        tickFormatter={(mes: string) => formatearMes(mes)}
                        {...EJE}
                        axisLine={{ stroke: COLOR.cuadricula }}
                        minTickGap={12}
                    />
                    <YAxis {...EJE_NUMERICO} width={48} />
                    <Tooltip
                        labelFormatter={(mes) => formatearMes(String(mes), 'largo')}
                        formatter={(valor) => [formatearNumero(Number(valor)), serie]}
                        contentStyle={ESTILO_TOOLTIP}
                    />
                    <Area
                        type="monotone"
                        dataKey="total"
                        stroke={COLOR.primario}
                        strokeWidth={2}
                        fill="url(#reporteria-area)"
                        activeDot={{ r: 4 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}

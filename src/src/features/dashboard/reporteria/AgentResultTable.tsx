/** Tabla con el resultado de una respuesta del agente. */

import { columnasVisibles, formatearCelda, formatearEncabezado, type FilaResultado } from './chat'
import styles from './AgentChatPanel.module.css'

export function AgentResultTable({ rows, columns: preferredColumns, llenar = false }: {
    rows: FilaResultado[]
    columns?: string[]
    llenar?: boolean
}) {
    const columns = columnasVisibles(rows, preferredColumns)
    if (columns.length === 0) return null

    return (
        <div className={llenar ? `${styles.tableWrap} ${styles.tableFill}` : styles.tableWrap}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column}
                                scope="col"
                                className={rows.some((row) => typeof row[column] === 'number') ? styles.numeric : undefined}
                            >
                                {formatearEncabezado(column)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <tr key={index}>
                            {columns.map((column) => (
                                <td
                                    key={column}
                                    className={typeof row[column] === 'number' ? styles.numeric : undefined}
                                >
                                    {formatearCelda(row[column], column)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

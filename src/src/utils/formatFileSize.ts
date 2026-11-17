/** Formato legible del peso de un archivo. */

const KB = 1024
const MB = 1024 * 1024

export function formatFileSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
    if (bytes < KB) return `${Math.round(bytes)} B`
    if (bytes < MB) return `${Math.round(bytes / KB)} KB`
    return `${(bytes / MB).toFixed(1)} MB`
}

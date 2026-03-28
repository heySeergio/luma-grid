export function getSafeCallbackUrl(rawValue: string | null | undefined, fallback = '/tablero') {
    if (!rawValue) {
        return fallback
    }

    if (!rawValue.startsWith('/')) {
        return fallback
    }

    if (rawValue.startsWith('//')) {
        return fallback
    }

    return rawValue
}

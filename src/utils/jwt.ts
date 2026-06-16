export type DecodedToken = {
    sub: number;
    email: string;
    nome?: string;
    tel: string;
    isAdmin: boolean;
    iat: number;
    exp: number;
}

export function decodeJwtPayload<T = DecodedToken>(token: string): T | null {
    const payload = token.split('.')[1];
    if (!payload) return null;

    try {
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
        const decoded = decodeURIComponent(
            atob(padded)
                .split('')
                .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
                .join('')
        );

        return JSON.parse(decoded) as T;
    } catch {
        return null;
    }
}

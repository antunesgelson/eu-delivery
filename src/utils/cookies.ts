type CookieOptions = {
    maxAge?: number;
    path?: string;
}

export function getClientCookies() {
    if (typeof document === 'undefined') return {};

    return document.cookie
        .split(';')
        .map((cookie) => cookie.trim())
        .filter(Boolean)
        .reduce<Record<string, string>>((acc, cookie) => {
            const [name, ...valueParts] = cookie.split('=');
            acc[decodeURIComponent(name)] = decodeURIComponent(valueParts.join('='));
            return acc;
        }, {});
}

export function setClientCookie(name: string, value: string, options: CookieOptions = {}) {
    if (typeof document === 'undefined') return;

    const maxAge = options.maxAge ? `; max-age=${options.maxAge}` : '';
    const path = `; path=${options.path ?? '/'}`;
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}${maxAge}${path}`;
}

export function deleteClientCookie(name: string, path = '/') {
    if (typeof document === 'undefined') return;

    document.cookie = `${encodeURIComponent(name)}=; max-age=0; path=${path}`;
}

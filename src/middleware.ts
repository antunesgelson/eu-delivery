import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { decodeJwtPayload } from './utils/jwt';

function getSafeCallbackUrl(request: NextRequest) {
    const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');

    if (!callbackUrl || !callbackUrl.startsWith('/') || callbackUrl.startsWith('//')) {
        return null;
    }

    return callbackUrl;
}

export async function middleware(request: NextRequest) {
    const tokenGoogle = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const isAuthenticate = tokenGoogle ? true : false;

    const url = request.url;
    const nextUrl = request.nextUrl;
    const cookies = request.cookies;
    const token = cookies.get("@eu:token");
    const ToHomeFirst = new URL('/?firstLogin=true', url);
    const ToHome = new URL('/', url);
    const ToSignin = new URL('/signin', url);
    const callbackPath = nextUrl.pathname === '/admin' ? '/admin/dashboard' : `${nextUrl.pathname}${nextUrl.search}`;
    ToSignin.searchParams.set('callbackUrl', callbackPath);


    if (nextUrl.pathname.startsWith('/signin') && isAuthenticate) {
        try {
            const authResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/entraroucadastrar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nome: tokenGoogle?.name,
                    email: tokenGoogle?.email,
                    token: process.env.TOKEN_SECRET,
                }),
            });

            if (authResponse.status !== 201) return NextResponse.redirect(ToHomeFirst);

            const data = await authResponse.json();
            const callbackUrl = getSafeCallbackUrl(request);
            const destinationUrl = callbackUrl ? new URL(callbackUrl, url) : ToHomeFirst;

            const expires = new Date();
            expires.setDate(expires.getDate() + 30);   // Definir a data de expiração do cookie (por exemplo, 30 dias a partir de agora)
            const response = NextResponse.redirect(destinationUrl);    // Definir o token no cookie
            response.cookies.set('@eu:token', data.token, { httpOnly: false, expires });

            return response;    // Redirecionar para a home com cookies definido.
        } catch {
            return NextResponse.next();
        }
    }

    if (nextUrl.pathname.startsWith('/admin')) { // Verifica se o usuário está tentando acessar a rota de admin
        if (nextUrl.pathname === '/admin') return NextResponse.redirect(ToSignin);

        if (!token) return NextResponse.redirect(ToSignin);

        const token_decoded = decodeJwtPayload(token.value);
        const isExpired = token_decoded?.exp ? token_decoded.exp * 1000 <= Date.now() : true;

        if (isExpired) return NextResponse.redirect(ToSignin);

        const isPermit = token_decoded?.isAdmin;
        if (!isPermit) return NextResponse.redirect(ToHome);// Verifica se o usuário tem permissão admin
    }


    return NextResponse.next();
}

export const config = {
    matcher: [
        '/signin',
        '/admin/:path*',
    ],
};

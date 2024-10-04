import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { api } from './service/api';

export async function middleware(request: NextRequest) {
    const tokenGoogle = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const isAuthenticate = tokenGoogle ? true : false;

    const url = request.url;
    const nextUrl = request.nextUrl;
    const ToHome = new URL('/?firstLogin=true', url);

    if (nextUrl.pathname.startsWith('/signin') && isAuthenticate) {
        try {
            const { data, status } = await api.post('/auth/entraroucadastrar', {
                nome: tokenGoogle?.name,
                email: tokenGoogle?.email,
                token: process.env.TOKEN_SECRET,
            })

            if (status !== 201) return NextResponse.redirect(ToHome);

            const expires = new Date();
            expires.setDate(expires.getDate() + 30);   // Definir a data de expiração do cookie (por exemplo, 30 dias a partir de agora)
            const response = NextResponse.redirect(ToHome);    // Definir o token no cookie
            response.cookies.set('@eu:token', data.token, { httpOnly: false, expires });

            return response;    // Redirecionar para a home com cookies definido.
        } catch (error) {
            console.log("error -> ", error);
            return NextResponse.next();
        }
    }
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/signin',
    ],
};
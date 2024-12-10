import { decode } from 'jsonwebtoken';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { DecodedToken } from './dto/tokenDTO';
import { api } from './service/api';

export async function middleware(request: NextRequest) {
    const tokenGoogle = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const isAuthenticate = tokenGoogle ? true : false;

    const url = request.url;
    const nextUrl = request.nextUrl;
    const cookies = request.cookies;
    const token = cookies.get("@eu:token");
    const ToHomeFirst = new URL('/?firstLogin=true', url);
    const ToHome = new URL('/', url);


    if (nextUrl.pathname.startsWith('/signin') && isAuthenticate) {
        try {
            const { data, status } = await api.post('/auth/entraroucadastrar', {
                nome: tokenGoogle?.name,
                email: tokenGoogle?.email,
                token: process.env.TOKEN_SECRET,
            })

            if (status !== 201) return NextResponse.redirect(ToHomeFirst);

            const expires = new Date();
            expires.setDate(expires.getDate() + 30);   // Definir a data de expiração do cookie (por exemplo, 30 dias a partir de agora)
            const response = NextResponse.redirect(ToHomeFirst);    // Definir o token no cookie
            response.cookies.set('@eu:token', data.token, { httpOnly: false, expires });

            return response;    // Redirecionar para a home com cookies definido.
        } catch (error) {
            console.log("error -> ", error);
            return NextResponse.next();
        }
    }

    if (nextUrl.pathname.startsWith('/admin') && token) { // Verifica se o usuário está tentando acessar a rota de admin
        const token_decoded = decode(token.value) as DecodedToken;
        // const isPermit = token_decoded.regras.some((regra) => regra === 'admin');
        // if (!isPermit) return NextResponse.redirect(ToHome);// Verifica se o usuário tem permissão admin
    }


    return NextResponse.next();
}

export const config = {
    matcher: [
        '/signin',
        '/admin/:path*',
    ],
};
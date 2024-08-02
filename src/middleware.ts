import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const isAuthenticate = token ? true : false;

    const cookies = request.cookies;
    const url = request.url;
    const nextUrl = request.nextUrl;
    const ToHome = new URL('/?firstLogin=true', url);

    if (nextUrl.pathname.startsWith('/signin') && isAuthenticate) {
        return NextResponse.redirect(ToHome);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/signin',
    ],
};
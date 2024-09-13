import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.NEXT_PUBLIC_GOOGLE_ID!,
            clientSecret: process.env.NEXT_PUBLIC_GOOGLE_SECRET!,
            authorization: {
                params: {
                    scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/calendar',
                }
            },
        }),
    ],

    callbacks: {
        async signIn({ account }: any) {
            if (!account.scope.includes('https://www.googleapis.com/auth/calendar')) {
                return '/signin/?error=permissions';
            }
            return true;
        }
    }
}
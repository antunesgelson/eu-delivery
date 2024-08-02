import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_ID!,
            clientSecret: process.env.GOOGLE_SECRET!,
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

            return true
        }
    }
}
export const hander = NextAuth(authOptions);

export { hander as GET, hander as POST };


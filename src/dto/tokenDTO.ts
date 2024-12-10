import { JwtPayload } from "jsonwebtoken"

export type DecodedToken = JwtPayload & {
    sub: number,
    email: string,
    tel: string,
    isAdmin: boolean,
    iat: number,
    exp: number
}



import { JwtPayload } from "jsonwebtoken"

export type DecodedToken = JwtPayload & {
    sub: number,
    email: string,
    nomeCompleto: string,
    regras: string[],
    iat: number,
    exp: number
}
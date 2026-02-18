import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            /** The user's id. */
            id: string
        } & DefaultSession["user"]
    }

    interface User extends DefaultUser {
        id: string
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        id?: string
    }
}

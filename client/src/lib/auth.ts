import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

console.log("DEBUG: Auth Env Vars", {
    GITHUB_ID: process.env.GITHUB_ID,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
});

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any, // Type assertion might be needed for v4 compatibility
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    debug: true,
};

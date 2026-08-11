import { withAuth } from "next-auth/middleware"

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      const path = req.nextUrl.pathname

      if (
        path === "/" ||
        path.startsWith("/documents/") ||
        path.startsWith("/api/") ||
        path.startsWith("/_next") ||
        path.startsWith("/static") ||
        path === "/login" ||
        path === "/register"
      ) {
        return true
      }

      return !!token
    },
  },
})

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}

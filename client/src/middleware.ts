import { withAuth } from "next-auth/middleware"

export default withAuth({
    callbacks: {
        authorized: ({ req, token }) => {
            const path = req.nextUrl.pathname;

            // Allow public access to:
            // - Landing page (/)
            // - Document pages (/documents/*) - access control handled in page
            // - Auth routes (/login, /register, /api/auth)
            // - Static assets (_next, images, etc.)
            if (
                path === "/" ||
                path.startsWith("/documents/") ||
                path.startsWith("/api/") ||
                path.startsWith("/_next") ||
                path.startsWith("/static") ||
                path === "/login" ||
                path === "/register"
            ) {
                return true;
            }

            // Require authentication for everything else (Dashboard, Settings, etc.)
            return !!token;
        },
    },
})

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (auth API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
    ],
}

import type { NextAuthConfig } from "next-auth";

// Tipo de rol de usuario
type UserRole = "athlete" | "coach";

export const authConfig = {
    pages: {
        signIn: "/",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
            const isOnOnboarding = nextUrl.pathname.startsWith("/onboarding");
            const isOnAuth = nextUrl.pathname === "/" || nextUrl.pathname.startsWith("/register");

            if (isOnAuth) {
                if (isLoggedIn) {
                    if (auth.user.role === "coach" || auth.user.onboardingCompleted) {
                        return Response.redirect(new URL("/dashboard", nextUrl));
                    } else {
                        return Response.redirect(new URL("/onboarding", nextUrl));
                    }
                }
                return true;
            }

            if (isOnOnboarding) {
                if (!isLoggedIn) return false;
                if (auth.user.role === "coach" || auth.user.onboardingCompleted) {
                    return Response.redirect(new URL("/dashboard", nextUrl));
                }
                return true;
            }

            // Protección del dashboard
            if (isOnDashboard) {
                if (isLoggedIn) {
                    // Si es atleta y no completó onboarding -> forzar onboarding
                    // Los coaches no necesitan onboarding
                    if (auth.user.role !== "coach" && !auth.user.onboardingCompleted) {
                        return Response.redirect(new URL("/onboarding", nextUrl));
                    }
                    return true;
                }
                return false; // Redirige usuarios no autenticados al login
            }

            return true;
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
                session.user.role = token.role as UserRole;
                session.user.onboardingCompleted = token.onboardingCompleted as boolean;
            }
            return session;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.sub = user.id;
                token.role = user.role as UserRole;
                token.onboardingCompleted = user.onboardingCompleted as boolean;
            }
            if (trigger === "update" && session) {
                token.onboardingCompleted = session.onboardingCompleted;
            }
            return token;
        }
    },
    providers: [], // Providers se añaden en auth.ts para Node runtime
    session: { strategy: "jwt" }
} satisfies NextAuthConfig;


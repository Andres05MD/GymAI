import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith("/") && !nextUrl.pathname.startsWith("/onboarding");
            const isOnOnboarding = nextUrl.pathname.startsWith("/onboarding");
            const isOnAuth = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");

            if (isOnAuth) {
                if (isLoggedIn) {
                    // Si ya está logueado y es coach o completó onboarding -> home
                    // Si es atleta y no completó onboarding -> onboarding
                    if (auth.user.role === "coach" || auth.user.onboardingCompleted) {
                        return Response.redirect(new URL("/", nextUrl));
                    } else {
                        return Response.redirect(new URL("/onboarding", nextUrl));
                    }
                }
                return true;
            }

            if (isOnOnboarding) {
                if (!isLoggedIn) return false; // Debe estar logueado
                // Coaches no necesitan onboarding
                if (auth.user.role === "coach" || auth.user.onboardingCompleted) {
                    return Response.redirect(new URL("/", nextUrl)); // Si ya terminó o es coach, fuera de aquí
                }
                return true;
            }

            // Dashboard protection
            if (isOnDashboard) {
                if (isLoggedIn) {
                    // Si es atleta y no completó onboarding -> forzar onboarding
                    // Los coaches no necesitan onboarding
                    if (auth.user.role === "athlete" && !auth.user.onboardingCompleted) {
                        return Response.redirect(new URL("/onboarding", nextUrl));
                    }
                    return true;
                }
                return false; // Redirect unauthenticated users to login page
            }

            return true;
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
                session.user.role = token.role as any;
                session.user.onboardingCompleted = token.onboardingCompleted as boolean;
            }
            return session;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.sub = user.id;
                token.role = user.role as any;
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

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import { db, auth as firebaseAuth } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { signInWithEmailAndPassword, AuthError } from "firebase/auth";
import { z } from "zod";
import { authConfig } from "./auth.config";

/**
 * Tipo para la respuesta de usuario de Firebase Identity Toolkit API
 */
interface FirebaseIdentityUser {
    localId: string;
    displayName?: string;
    email: string;
    photoUrl?: string;
}

/**
 * Tipo para la respuesta de Identity Toolkit API
 */
interface IdentityToolkitResponse {
    users?: FirebaseIdentityUser[];
    error?: { message: string };
}

/**
 * Tipo de usuario para autenticación (compatible con NextAuth)
 */
interface AuthUser {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    role: "athlete" | "coach";
    emailVerified?: Date | null;
    onboardingCompleted: boolean;
}

/**
 * Obtiene un usuario de Firestore por email
 */
async function getUserByEmail(email: string): Promise<AuthUser | null> {
    try {
        const q = query(
            collection(db, "users"),
            where("email", "==", email),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return null;
        const d = querySnapshot.docs[0].data();
        return {
            id: querySnapshot.docs[0].id,
            name: d.name,
            email: d.email,
            image: d.image,
            role: d.role,
            onboardingCompleted: d.onboardingCompleted,
        } as AuthUser;
    } catch (error) {
        console.error("Error obteniendo usuario por email:", error);
        return null;
    }
}

/**
 * Obtiene un usuario de Firestore por ID
 */
async function getUserById(id: string): Promise<AuthUser | null> {
    try {
        const userDoc = await getDoc(doc(db, "users", id));
        if (!userDoc.exists()) return null;
        const d = userDoc.data();
        return {
            id: userDoc.id,
            name: d.name,
            email: d.email,
            image: d.image,
            role: d.role,
            onboardingCompleted: d.onboardingCompleted,
        } as AuthUser;
    } catch (error) {
        console.error("Error obteniendo usuario por ID:", error);
        return null;
    }
}

// NOTE: FirestoreAdapter tiene problemas de tipos conocidos con NextAuth v5 y Firebase SDK cliente.
// Se usa "as any" intencionalmente para compatibilidad. Ver: https://github.com/nextauthjs/next-auth/issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: FirestoreAdapter(db as any) as any,
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
                idToken: { label: "Identity Token", type: "text" },
            },
            async authorize(credentials) {
                // Estrategia 1: Login con Token de Firebase (Google Auth client-side)
                if (credentials?.idToken) {
                    try {
                        const idToken = credentials.idToken as string;

                        // Verificar el token con la API REST de Google Identity Toolkit (método seguro server-side)
                        // Alternativamente, se puede usar firebase-admin si se prefiere no usar REST directo
                        const res = await fetch(
                            `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
                            {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ idToken })
                            }
                        );

                        const data: IdentityToolkitResponse = await res.json();

                        if (!res.ok || !data.users || data.users.length === 0) {
                            console.error("Error validando token de Firebase:", data);
                            return null;
                        }

                        const firebaseUser = data.users[0];
                        const userId = firebaseUser.localId;

                        // Buscar usuario en Firestore por su UID
                        const user = await getUserById(userId);

                        if (!user) {
                            // Si no existe, lo creamos automáticamente en Firestore
                            const newUser: AuthUser = {
                                id: userId,
                                name: firebaseUser.displayName || "Usuario",
                                email: firebaseUser.email,
                                image: firebaseUser.photoUrl || "",
                                role: "athlete",
                                emailVerified: new Date(),
                                onboardingCompleted: false,
                            };

                            try {
                                await setDoc(doc(db, "users", userId), {
                                    ...newUser,
                                    createdAt: Timestamp.now(),
                                    updatedAt: Timestamp.now(),
                                });
                                return newUser;
                            } catch (createError) {
                                console.error("Error creando usuario en Firestore:", createError);
                                // Si falla la creación, retornamos el objeto básico para permitir login
                                // aunque no se haya guardado en BD (fallback)
                                return newUser;
                            }
                        }

                        return user;

                    } catch (error) {
                        console.error("Error en autenticación con token:", error);
                        return null;
                    }
                }

                // Estrategia 2: Login con Email/Password usando Firebase Authentication
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (!parsedCredentials.success) {
                    console.error("Credenciales inválidas");
                    return null;
                }

                const { email, password } = parsedCredentials.data;

                try {
                    // Autenticar con Firebase Auth
                    const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
                    const firebaseUser = userCredential.user;

                    // Buscar datos adicionales del usuario en Firestore
                    const userData = await getUserById(firebaseUser.uid);

                    // Cerrar sesión de Firebase Auth (NextAuth maneja la sesión)
                    await firebaseAuth.signOut();

                    if (userData) {
                        return userData;
                    }

                    // Si no hay datos en Firestore, retornamos datos básicos de Firebase Auth
                    const fallbackUser: AuthUser = {
                        id: firebaseUser.uid,
                        email: firebaseUser.email || email,
                        name: firebaseUser.displayName || email,
                        image: firebaseUser.photoURL,
                        emailVerified: firebaseUser.emailVerified ? new Date() : null,
                        role: "athlete",
                        onboardingCompleted: false
                    };
                    return fallbackUser;

                } catch (error) {
                    const authError = error as AuthError;
                    console.error("Error en login con email/password:", authError.code, authError.message);
                    return null;
                }
            },
        }),
    ],
    session: { strategy: "jwt" }
});

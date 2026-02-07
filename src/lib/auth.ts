import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import { db, auth as firebaseAuth } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { z } from "zod";
import { authConfig } from "./auth.config";

/**
 * Obtiene un usuario de Firestore por email
 */
async function getUserByEmail(email: string) {
    try {
        const q = query(
            collection(db, "users"),
            where("email", "==", email),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return null;
        return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as any;
    } catch (error) {
        console.error("Error fetching user by email:", error);
        return null;
    }
}

/**
 * Obtiene un usuario de Firestore por ID
 */
async function getUserById(id: string) {
    try {
        const userDoc = await getDoc(doc(db, "users", id));
        if (!userDoc.exists()) return null;
        return { id: userDoc.id, ...userDoc.data() } as any;
    } catch (error) {
        console.error("Error fetching user by id:", error);
        return null;
    }
}

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

                        const data = await res.json();

                        if (!res.ok || !data.users || data.users.length === 0) {
                            console.error("Error validando token de Firebase:", data);
                            return null;
                        }

                        const firebaseUser = data.users[0];
                        const userId = firebaseUser.localId;

                        // Buscar usuario en Firestore por su UID
                        let user = await getUserById(userId);

                        if (!user) {
                            // Si no existe, lo creamos automáticamente en Firestore
                            const newUser = {
                                id: userId,
                                name: firebaseUser.displayName || "Usuario",
                                email: firebaseUser.email,
                                image: firebaseUser.photoUrl || "",
                                role: "athlete",
                                emailVerified: new Date(),
                                onboardingCompleted: false,
                                createdAt: Timestamp.now(),
                                updatedAt: Timestamp.now(),
                            };

                            try {
                                await setDoc(doc(db, "users", userId), newUser);
                                return newUser;
                            } catch (createError) {
                                console.error("Error creando usuario en Firestore:", createError);
                                // Si falla la creación, retornamos el objeto básico para permitir login
                                // aunque no se haya guardado en BD (fallback)
                                return {
                                    id: userId,
                                    name: newUser.name,
                                    email: newUser.email,
                                    image: newUser.image,
                                    emailVerified: newUser.emailVerified,
                                    role: newUser.role,
                                    onboardingCompleted: newUser.onboardingCompleted
                                };
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
                    return {
                        id: firebaseUser.uid,
                        email: firebaseUser.email,
                        name: firebaseUser.displayName || email,
                        image: firebaseUser.photoURL,
                        emailVerified: firebaseUser.emailVerified ? new Date() : null,
                        role: "athlete",
                        onboardingCompleted: false
                    };

                } catch (error: any) {
                    console.error("Error en login con email/password:", error.code, error.message);
                    return null;
                }
            },
        }),
    ],
    session: { strategy: "jwt" }
});

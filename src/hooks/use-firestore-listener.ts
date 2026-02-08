"use client";

import { useEffect, useRef, useCallback } from "react";
import {
    onSnapshot,
    Query,
    DocumentReference,
    Unsubscribe,
    DocumentData,
    QuerySnapshot,
    DocumentSnapshot
} from "firebase/firestore";

type SnapshotCallback<T extends DocumentData> = (data: QuerySnapshot<T> | DocumentSnapshot<T>) => void;
type ErrorCallback = (error: Error) => void;

interface UseFirestoreOptions {
    /** Si true, pausa el listener cuando la pestaña no está visible */
    pauseWhenHidden?: boolean;
    /** Callback para errores */
    onError?: ErrorCallback;
}

/**
 * Hook seguro para listeners de Firestore que previene fugas de memoria.
 * Automáticamente limpia el listener cuando el componente se desmonta.
 * 
 * @example
 * ```tsx
 * const { subscribe } = useFirestoreListener();
 * 
 * useEffect(() => {
 *   const cleanup = subscribe(
 *     query(collection(db, "users")),
 *     (snapshot) => setUsers(snapshot.docs.map(d => d.data()))
 *   );
 *   return cleanup;
 * }, [subscribe]);
 * ```
 */
export function useFirestoreListener(options: UseFirestoreOptions = {}) {
    const { pauseWhenHidden = false, onError } = options;
    const unsubscribesRef = useRef<Set<Unsubscribe>>(new Set());
    const isPausedRef = useRef(false);

    // Limpiar todos los listeners al desmontar
    useEffect(() => {
        return () => {
            unsubscribesRef.current.forEach(unsub => {
                try {
                    unsub();
                } catch (e) {
                    console.warn("Error al limpiar listener:", e);
                }
            });
            unsubscribesRef.current.clear();
        };
    }, []);

    // Pausar/reanudar basado en visibilidad
    useEffect(() => {
        if (!pauseWhenHidden) return;

        const handleVisibilityChange = () => {
            isPausedRef.current = document.hidden;
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [pauseWhenHidden]);

    const subscribe = useCallback(<T extends DocumentData>(
        queryOrRef: Query<T> | DocumentReference<T>,
        callback: SnapshotCallback<T>
    ): Unsubscribe => {
        const unsubscribe = onSnapshot(
            queryOrRef as Query<T>,
            (snapshot: QuerySnapshot<T>) => {
                if (isPausedRef.current) return;
                callback(snapshot);
            },
            (error: Error) => {
                console.error("Error en Firestore listener:", error);
                onError?.(error);
            }
        );

        unsubscribesRef.current.add(unsubscribe);

        // Retornar función de cleanup que remueve de la lista
        return () => {
            unsubscribe();
            unsubscribesRef.current.delete(unsubscribe);
        };
    }, [onError]);

    const unsubscribeAll = useCallback(() => {
        unsubscribesRef.current.forEach(unsub => unsub());
        unsubscribesRef.current.clear();
    }, []);

    return {
        subscribe,
        unsubscribeAll,
        activeListeners: unsubscribesRef.current.size,
    };
}

/**
 * Hook simplificado para un solo listener.
 * Uso más directo cuando solo necesitas escuchar una query.
 */
export function useFirestoreQuery<T extends DocumentData>(
    query: Query<T> | null,
    callback: SnapshotCallback<T>,
    deps: React.DependencyList = []
) {
    const { subscribe } = useFirestoreListener();

    useEffect(() => {
        if (!query) return;

        return subscribe(query, callback);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, subscribe, ...deps]);
}

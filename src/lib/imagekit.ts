// Configuración del cliente de ImageKit para subidas
// Adaptado para @imagekit/javascript v5+ (API funcional)
import { upload, buildSrc } from "@imagekit/javascript";

const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!;
const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!;

/**
 * Opciones para el wrapper de upload (campos requeridos por el SDK v5 se añaden automáticamente)
 */
interface ImageKitUploadOptions {
    file: string | Blob | File;
    fileName: string;
    token: string;
    signature: string;
    expire: number;
    folder?: string;
    tags?: string[];
    useUniqueFileName?: boolean;
    isPrivateFile?: boolean;
    customMetadata?: Record<string, unknown>;
}

/**
 * Opciones para el wrapper de URL
 */
interface ImageKitUrlOptions {
    src: string;
    path?: string;
    transformation?: Array<Record<string, string | number>>;
}

// Cliente de ImageKit simulado para mantener compatibilidad con la estructura anterior
export const imagekit = {
    // Wrapper para la función upload del SDK v5
    upload: (options: ImageKitUploadOptions) => {
        return upload({
            publicKey,
            ...options,
        });
    },
    // Wrapper para la función url del SDK v5 (usando buildSrc)
    url: (options: ImageKitUrlOptions) => {
        return buildSrc({
            urlEndpoint,
            ...options
        });
    }
};

// Tipos de archivo permitidos para ejercicios
export const ALLOWED_FILE_TYPES = {
    image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    video: ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"],
};

// Tamaño máximo de archivo (50MB para videos)
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Función para validar el tipo de archivo
export function isValidFileType(file: File): boolean {
    const allAllowedTypes = [...ALLOWED_FILE_TYPES.image, ...ALLOWED_FILE_TYPES.video];
    return allAllowedTypes.includes(file.type);
}

// Función para determinar si es imagen o video
export function getFileCategory(file: File): "image" | "video" | null {
    if (ALLOWED_FILE_TYPES.image.includes(file.type)) return "image";
    if (ALLOWED_FILE_TYPES.video.includes(file.type)) return "video";
    return null;
}

// Función para formatear el tamaño del archivo
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

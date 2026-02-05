// Configuración del cliente de ImageKit para subidas
// Usamos require para evitar problemas con la importación default en Next.js
const ImageKit = require("@imagekit/javascript");

// Cliente de ImageKit configurado con las credenciales públicas
export const imagekit = new ImageKit({
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
});

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

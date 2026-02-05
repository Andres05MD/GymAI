import { NextResponse } from "next/server";
import crypto from "crypto";

// Endpoint para generar parámetros de autenticación para subir archivos a ImageKit
// ImageKit requiere un token, expire y signature para subidas autenticadas

export async function GET() {
    try {
        const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

        if (!privateKey) {
            return NextResponse.json(
                { error: "Configuración de ImageKit no disponible" },
                { status: 500 }
            );
        }

        // Token único para cada solicitud de subida
        const token = crypto.randomBytes(32).toString("hex");

        // Tiempo de expiración (10 minutos desde ahora)
        const expire = Math.floor(Date.now() / 1000) + 600;

        // Generar la firma HMAC
        const signatureString = token + expire;
        const signature = crypto
            .createHmac("sha1", privateKey)
            .update(signatureString)
            .digest("hex");

        return NextResponse.json({
            token,
            expire,
            signature,
        });
    } catch (error) {
        console.error("Error generando autenticación de ImageKit:", error);
        return NextResponse.json(
            { error: "Error al generar credenciales de subida" },
            { status: 500 }
        );
    }
}
